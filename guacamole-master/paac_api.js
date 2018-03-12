import Frisbee from 'frisbee';
const rtpidatafeed = 'Port Authority Bus';

export const trueTimeApi = new Frisbee({
  baseURI: 'http://truetime.portauthority.org/bustime/api/v3/',
  headers: {
    'Accept': 'application/json',
  }
});

export const apiKey = "E7kruijwDBj9MsBdvZ7J4cqa9";

export function getPredictionsByStopId(stopId, route = undefined) {
  return getPredictionsByStopIds([stopId], route);
}

export async function getPredictionsByStopIds(stopIds, route = undefined) {
  const result = await trueTimeApi.get('getpredictions', {
    body: {
      key: apiKey,
      rtpidatafeed,
      format: 'json',
      rt: route,
      stpid: stopIds.join(','),
      tmres: 's',
    },
  });
  const element = result.body['bustime-response'];
  try {
    handleError(element.error);
  } catch (err) {
    if (err.message === 'No arrival times') {
      return [];
    } else if (err.message === 'No service scheduled') {
      return [];
    }
    throw err;
  }
  return element.prd;
};

export async function getStopsOfRoute(route, dir) {
  const result = await trueTimeApi.get('getstops', {
    body: {
      key: apiKey,
      rtpidatafeed,
      format: 'json',
      rt: route,
      dir,
    },
  });
  const element = result.body['bustime-response'];
  handleError(element.error);
  return element.stops;
};

export async function getDirectionsOfRoute(route) {
  const result = await trueTimeApi.get('getdirections', {
    body: {
      key: apiKey,
      rtpidatafeed,
      format: 'json',
      rt: route,
    },
  });
  const element = result.body['bustime-response'];
  handleError(element.error);
  return element.directions;
};

export async function getServiceBulletins(routes) {
  const result = await trueTimeApi.get('getservicebulletins', {
    body: {
      key: apiKey,
      rtpidatafeed,
      format: 'json',
      rt: routes.join(','),
    },
  });
  const element = result.body['bustime-response'];
  try {
    handleError(element.error);
  } catch (err) {
    if (err.message === 'No data found for parameter') {
      return [];
    }
    throw err;
  }
  return element.sb;
};

function handleError(error) {
  if (!error) return;
  throw new Error(error[0].msg);
}
