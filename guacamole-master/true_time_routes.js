import {parseLatLng} from './maps_api';
import * as paacApi from './paac_api';
import {findNearest} from 'geolib';
import moment from 'moment';

export async function loadTrueTimeForRoutes(routes, departAt, arriveAt) {
  if (departAt && Math.abs(departAt.diff(moment(), 'minutes')) > 30) return;
  const itemsToProcess = getItemsToProcessFromRoutes(routes);
  await guessStopIdForItems(itemsToProcess);
  await populateTrueTimeForItems(itemsToProcess, departAt, arriveAt);
  for (const route of routes) {
    enhanceTimePredictionForRoute(route);
  }
  const serviceBulletins = await getServiceBulletins(itemsToProcess, departAt,
    arriveAt);
  return {routes, serviceBulletins};
}

async function guessStopIdForItems(itemsToProcess) {
  const itemsByRouteAndDir = groupBy(itemsToProcess, 'routeId', 'direction');
  for (const [{routeId, direction}, items] of itemsByRouteAndDir.entries()) {
    try {
      stops = await paacApi.getStopsOfRoute(routeId, direction);
    } catch (err) {
      console.log('TrueTime error: ', err);
    }
    const stopDict = {};
    for (const stop of stops) {
      stopDict[stop.stpid] = {
        latitude: stop.lat,
        longitude: stop.lon,
      };
    }
    const itemsByLocation = groupBy(items, 'location');
    for (const [location, items] of itemsByLocation) {
      const stpid = findNearest(location, stopDict).key;
      for (const item of items) {
        item.stpid = stpid;
      }
    }
  }
}

function getItemsToProcessFromRoutes(routes) {
  const itemsToProcess = [];
  for (const route of routes) {
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        if (step.travel_mode === 'TRANSIT') {
          const transit = step.transit_details;
          if (!transit.line.agencies.some(agencyIsPortAuthority)) {
            break;
          }
          const routeId = transit.line.short_name;
          const location = parseLatLng(transit.departure_stop.location);
          const direction = transit.headsign.split('-')[0].toUpperCase();
          itemsToProcess.push({
            routeId,
            location,
            direction,
            step,
            type: 'departure',
          });
          // For now, handle the first stop ONLY.
          break;
        }
      }
    }
  }
  return itemsToProcess;
}

function agencyIsPortAuthority(agency) {
  return (agency.url === 'http://www.portauthority.org/');
}

async function populateTrueTimeForItems(itemsToProcess, departAt, arriveAt) {
  const itemsByStpid = groupBy(itemsToProcess, 'stpid');
  const stpids = Array.from(itemsByStpid.keys());
  if (stpids.length === 0) return;
  const predictions = await paacApi.getPredictionsByStopIds(stpids);
  for (const {rt, stpid, rtdir, prdtm, dly, dyn} of predictions) {
    for (const item of itemsByStpid.get(stpid)) {
      if (item.direction !== rtdir || item.routeId !== rt) continue;
      const predictedTime = moment(prdtm, 'YYYYMMDD HH:mm:ss');
      let changeTypeId = dyn;
      if (mockChanges) {
        changeTypeId = Math.round(Math.random() * 5);
      }
      const changeType =
        {0: null, 1: 'cancelled', 3: 'shifted', 4: 'expressed'}[changeTypeId];
      const trueTime = {predictedTime, isDelayed: dly, changeType};
      if (mockDelay) {
        trueTime.isDelayed = (Math.random() <= 0.5);
      }
      if (item.type === 'departure') {
        if (departAt && departAt > predictedTime) continue;
        if (arriveAt && arriveAt <= predictedTime) continue;
        item.step.departureTrueTime = item.step.departureTrueTime || trueTime;
        item.step.departureTrueTimes = item.step.departureTrueTimes || [];
        item.step.departureTrueTimes.push(trueTime);
      }
    }
  }
}

function enhanceTimePredictionForRoute(route) {
  for (const leg of route.legs) {
    let offsetMs = null;
    for (const step of leg.steps) {
      if (step.travel_mode === 'TRANSIT') {
        const transit = step.transit_details;
        if (step.departureTrueTime) {
          const originalDepartAt = moment.unix(transit.departure_time.value);
          const newDepartAt = step.departureTrueTime.predictedTime;
          if (Math.abs(newDepartAt.diff(originalDepartAt, 'minutes')) >= 30) {
            break;
          }
          offsetMs = newDepartAt.diff(originalDepartAt);
          transit.departure_time = withOffset(transit.departure_time, offsetMs);
          delete transit.departure_time.isAdjusted;
          transit.departure_time.isHighAccuracy = true;
        } else {
          transit.departure_time = withOffset(transit.departure_time, offsetMs);
        }
        transit.arrival_time = withOffset(transit.arrival_time, offsetMs);
      }
    }
    leg.departure_time = withOffset(leg.departure_time, offsetMs);
    leg.arrival_time = withOffset(leg.arrival_time, offsetMs);
  }

  function withOffset(timeObj, offsetMs) {
    if (!timeObj) return timeObj;
    if (offsetMs == null) return timeObj;
    const originalTime = moment.unix(timeObj.value);
    const newTime = originalTime.clone().add(offsetMs, 'ms');
    return {
      ...timeObj,
      value: newTime.unix(),
      text: newTime.format('h:mma'),
      isAdjusted: true,
    };
  }
}

async function getServiceBulletins(itemsToProcess, departAt, arriveAt) {
  const routeIds = new Set();
  for (const item of itemsToProcess) {
    routeIds.add(item.routeId);
  }
  let result;
  if (mockServiceBulletinsResponse) {
    result = mockServiceBulletinsResponse;
  } else {
    result = await paacApi.getServiceBulletins(Array.from(routeIds));
  }
  return result.map(sb => ({
    id: sb.nm,
    title: sb.sbj,
    summary: sb.brf,
    details: sb.dtl,
    priority: sb.prty,
  }));
}

let mockChanges = false;
let mockDelay = false;
let mockServiceBulletinsResponse;

export function enableMockChanges() {
  mockChanges = true;
  mockDelay = true;
  mockServiceBulletinsResponse = [
    {
      nm: 'Mock Announcement #2',
      sbj: 'Warning',
      dtl: 'PENS Traffic may impact this evening between 5pm to 730pm and' +
        ' 9pm to 1130pm or later.',
      brf: 'PENS Traffic may impact this evening between 5pm to 730pm and' +
        ' 9pm to 1130pm or later.',
      prty: "Medium",
      rtpidatafeed: 'Port Authority Bus',
      srvc: []
    },
  ];
}

export function groupBy(list, ...keys) {
  let result = new Map();
  let groupForKeyStr = new Map();

  for (const item of list) {
    let keyObj;
    if (keys.length === 1) {
      keyObj = item[keys[0]];
    } else {
      keyObj = {};
      for (const key of keys) {
        keyObj[key] = item[key];
      }
    }
    const keyStr = JSON.stringify(keyObj);
    let group = groupForKeyStr.get(keyStr);
    if (!group) {
      group = [];
      result.set(keyObj, group);
      groupForKeyStr.set(keyStr, group);
    }
    group.push(item);
  }
  return result;
}
