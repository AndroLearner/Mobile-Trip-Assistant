import React, {Component} from 'react';
import {View, ScrollView, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StepsBreadcumb from './StepsBreadcumb';
import TimeDisp from './TimeDisp';
import LeaveHint from './LeaveHint';
import Touchable from './Touchable';

export default class RouteDetails extends Component {
  render() {
    const noop = () => {};
    const {onStepSelected = noop, onPlaceSelected = noop} = this.props;
    const renderStep = (step, i) => {
      const onPress = () => onStepSelected(step);
      if (step.travel_mode === 'WALKING') {
        return <WalkStep key={i} step={step} onPress={onPress} />;
      } else if (step.travel_mode === 'TRANSIT') {
        return <TransitStep key={i} step={step} onPress={onPress} />;
      } else {
        throw new Error(step.travel_mode);
      }
    };
    // TODO: Multiple legs?
    const leg = this.props.route.legs[0];
    return (
      <View style={[styles.routeDetails, this.props.style]}>
        <Touchable disabled={!this.props.minimized}
          onPress={this.props.onPress}>
          <View style={styles.overview}>
            <StepsBreadcumb steps={leg.steps} />
            <Text style={styles.overviewText}>{leg.duration.text}</Text>
          </View>
        </Touchable>
        {!this.props.minimized && (
          <ScrollView style={styles.details}>
            <View style={{paddingBottom: 60}}>
              <PlaceStep
                place={this.props.startingPlace}
                time={leg.departure_time}
                onPress={() => onPlaceSelected(this.props.startingPlace)}
              />
              {leg.steps.map(renderStep)}
              <PlaceStep
                isDestination={true}
                place={this.props.destinationPlace}
                time={leg.arrival_time}
                onPress={() => onPlaceSelected(this.props.destinationPlace)}
              />
            </View>
          </ScrollView>
        )}
      </View>
    );
  }
};

function PlaceStep({place, time, isDestination, onPress}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepLegend}>
        {place.isMyLocation
            ? <Icon name="my-location" size={30} />
            : <Icon name="place" color={isDestination ? "#8bc34a" : undefined}
                size={30} />
        }
      </View>
      <Touchable onPress={onPress}>
        <View style={styles.stepCard}>
          <View style={styles.stepInstr}>
            <Text style={styles.stepDesc}>
              {place.isMyLocation ? 'Your location' : (place.name || place.address)}
            </Text>
            <TimeDisp time={time} style={styles.stepTime} />
          </View>
          {place && place.name && (
            <View><Text style={styles.address}>{place.address}</Text></View>
          )}
          {!isDestination && time && (
            <View>
              <LeaveHint style={{fontSize: 16}} time={time} />
            </View>
          )}
        </View>
      </Touchable>
    </View>
  );
}

function TransitStep({step, onPress}) {
  const transit = step.transit_details;
  return (
    <View style={styles.step}>
      <View style={styles.stepLegend}>
        <View style={{alignItems: 'center'}}>
          <Icon name="directions-bus" size={30} />
          <Text style={styles.stepLabel}>{transit.line.short_name}</Text>
        </View>
      </View>
      <Touchable onPress={onPress}>
        <View style={styles.stepCard}>
          <View style={styles.stepInstr}>
            <View style={{flex: 1}}>
              <Text style={styles.stepDesc}>
                {transit.departure_stop.name}
              </Text>
              <Text>{transit.headsign}</Text>
            </View>
            <TimeDisp time={transit.departure_time} style={styles.stepTime} />
          </View>
          <View style={{padding: 15}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="more-vert" size={30} />
              <Text>Ride {transit.num_stops} stops ({step.duration.text})</Text>
            </View>
          </View>
          <View style={styles.stepInstr}>
            <Text style={styles.stepDesc}>
              {transit.arrival_stop.name}
            </Text>
            <TimeDisp time={transit.arrival_time} style={styles.stepTime} />
          </View>
        </View>
      </Touchable>
    </View>
  );
}

function WalkStep({step, onPress}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepLegend}>
        <View style={{alignItems: 'center'}}>
          <Icon name="directions-walk" size={30} />
        </View>
      </View>
      <Touchable onPress={onPress}>
        <View style={styles.stepCard}>
          <View style={styles.stepInstr}>
            <Text style={styles.stepDesc}>
              Walk {step.duration.text} ({step.distance.text})
            </Text>
          </View>
        </View>
      </Touchable>
    </View>
  );
}

const styles = StyleSheet.create({
  routeDetails: {
    elevation: 10,
    backgroundColor: '#f3f3f3',
  },
  overview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    elevation: 2,
    backgroundColor: '#fff',
  },
  overviewText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    paddingVertical: 20,
    paddingRight: 10,
  },
  step: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    marginBottom: 15,
  },
  stepLegend: {
    width: 60,
    alignItems: 'center',
  },
  stepLabel: {
    backgroundColor: '#ccc',
    paddingHorizontal: 5,
  },
  stepCard: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 2,
    elevation: 1,
  },
  stepInstr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stepDesc: {
    flex: 1,
    fontWeight: 'bold',
    fontSize: 16,
  },
  timeDesc: {
    fontSize: 16,
  },
});
