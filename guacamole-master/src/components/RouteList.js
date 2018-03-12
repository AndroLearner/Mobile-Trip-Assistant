import React, { Component } from 'react';
import {
  ScrollView, Text, View, StyleSheet, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StepsBreadcumb from './StepsBreadcumb';
import TimeDisp from './TimeDisp';
import LeaveHint from './LeaveHint';
import Touchable from './Touchable';

export default function RouteList({routes, onRouteSelected, style,
    serviceBulletins}) {
  return (
    <ScrollView style={styles.routeList}>
      <View style={style}>
        {serviceBulletins && serviceBulletins.map((sb, i) => {
          let backgroundColor = '#F6B936';
          if (sb.priority === 'High') backgroundColor = '#E53935';
          return (
            <View key={i} style={{backgroundColor}}>
              <Touchable
                onPress={() => alert(sb.details)}>
                <View style={styles.serviceBulletinsContent}>
                  <Text style={{color: '#fff'}}>
                    <Icon name="warning" size={16} />
                    <Text style={{fontSize: 16, fontWeight: 'bold'}}> {sb.title}: </Text>
                    <Text style={{fontSize: 16}}>{sb.summary}</Text>
                  </Text>
                </View>
              </Touchable>
            </View>
          )
        })}
        {routes ? routes.map((route, i) => (
          <View key={i} style={{backgroundColor: '#fff'}}>
            <Touchable
              onPress={() => onRouteSelected && onRouteSelected(route)}>
              <View>
                <RouteOverview route={route} />
              </View>
            </Touchable>
          </View>
        )) : loading()}
      </View>
    </ScrollView>
  );

  function loading() {
    return <ActivityIndicator
      animating={true}
      style={styles.loading}
      size="large"
    />
  }
}

function RouteOverview({route}) {
  // TODO: Multiple legs?
  const leg = route.legs[0];
  let isDelayed = false;
  let changeType = null;
  let firstTransit = null;
  for (const step of leg.steps) {
    if (step.travel_mode === 'TRANSIT') {
      firstTransit = step.transit_details;
      if (step.departureTrueTime) {
        ({isDelayed, changeType} = step.departureTrueTime);
      }
      break;
    }
  }
  return (
    <View style={styles.overview}>
      <View style={styles.overviewDesc}>
        <StepsBreadcumb steps={leg.steps} />
        <Text style={styles.duration}>{leg.duration.text}</Text>
      </View>
      {changeType && (
        <View style={styles.overviewDesc}>
          <Text style={{color: changeType === 'shifted' ? '#FFC107' : '#F44336'}}>
            <Icon name="warning" size={16} />
            {changeType === 'expressed' && (
              <Text style={{fontSize: 16}}> NO PICKUPS</Text>
            )}
            {changeType === 'cancelled' && (
              <Text style={{fontSize: 16}}> CANCELLED</Text>
            )}
            {changeType === 'shifted' && (
              <Text style={{fontSize: 16}}> SCHEDULED TIME CHANGED</Text>
            )}
          </Text>
        </View>
      )}
      <View style={styles.overviewDesc}>
        <RouteOverviewTime route={route} textStyle={[styles.overviewText]} />
        {route.fare && <Text style={styles.fare}>{route.fare.text}</Text>}
      </View>
      {firstTransit && (
        <View style={styles.overviewDesc}>
          <Text style={styles.additionalInfo}>
            <TimeDisp time={firstTransit.departure_time} />
            <Text>
              {' from ' + firstTransit.departure_stop.name}
            </Text>
          </Text>
        </View>
      )}
      {firstTransit && (
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <LeaveHint style={{fontSize: 16}} time={route.legs[0].departure_time} />
          {isDelayed && <Text style={styles.delayIndicator}>DELAYED</Text>}
        </View>
      )}
    </View>
  );
}

function RouteOverviewTime({route, style, textStyle}) {
  const departureTime = route.legs[0].departure_time;
  const arrivalTime = route.legs[route.legs.length - 1].arrival_time;
  const viewStyle = {flexDirection: 'row'};
  if (departureTime && arrivalTime) {
    return (
      <View style={[viewStyle, style]}>
        <TimeDisp time={departureTime} style={textStyle} />
        <Text style={textStyle}> — </Text>
        <TimeDisp time={arrivalTime} style={textStyle} />
      </View>
    )
  } else if (departureTime) {
    return (
      <View style={[viewStyle, style]}>
        <Text style={textStyle}>Depart at </Text>
        <TimeDisp time={departureTime} style={textStyle} />
      </View>
    )
  } else {
    const fallbackText = route.legs.map(leg => leg.distance.text).join(', ');
    return (
      <View style={[viewStyle, style]}>
        <Text style={textStyle}>{fallbackText}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    height: 80
  },
  overview: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  overviewDesc: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeList: {
    backgroundColor: '#f0f0f0',
  },
  duration: {
    fontSize: 16,
    color: '#333',
  },
  overviewText: {
    fontSize: 16,
    color: '#333',
  },
  additionalInfo: {
    fontSize: 16,
  },
  serviceBulletinsContent: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderColor: '#fff',
    borderBottomWidth: 1,
  },
  delayIndicator: {
    backgroundColor: '#CDDC39',
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
