import moment from 'moment';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TimePickerAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Touchable from './Touchable';

export default class DirectionConfig extends Component {
  state = {};
  render() {
    let {departureTime, arrivalTime} = this.state;
    if (!departureTime && !arrivalTime) {
      departureTime = moment();
    }
    const departureTimeStr =
      departureTime ? departureTime.format('h:mma') : '…';
    const arrivalTimeStr = arrivalTime ? arrivalTime.format('h:mma') : '…';

    return (
      <View style={styles.directionConfig}>
        {!this.props.expanded && (
          <Touchable highlightColor='#8bc34a'
            onPress={() => this.onConfigSet({})}>
            <View style={[styles.directionConfigItem,
              {flex: 1, justifyContent: 'center'}]}>
              <Text style={styles.getDirectionsButton}>NEXT</Text>
            </View>
          </Touchable>
        )}
        {this.props.expanded && (
          <Touchable highlightColor='#8bc34a'
            onPress={this.setDepartureTime.bind(this)}>
            <View style={[
              styles.directionConfigItem,
              departureTime ? styles.directionConfigItemActive : {},
            ]}>
              <Icon name="schedule" color="#fff" size={24}
                style={{padding: 8}}
              />
              <Text style={styles.directionConfigTime}>
                Depart at {departureTimeStr}
              </Text>
            </View>
          </Touchable>
        )}
        {this.props.expanded && (
          <Touchable highlightColor='#8bc34a'
            onPress={this.setArrivalTime.bind(this)}>
            <View style={[
              styles.directionConfigItem,
              arrivalTime ? styles.directionConfigItemActive : {},
            ]}>
              <Icon name="update" color="#fff" size={28}
                style={{padding: 6}}
              />
              <Text style={styles.directionConfigTime}>
                Arrive by {arrivalTimeStr}
              </Text>
            </View>
          </Touchable>
        )}
      </View>
    );
  }

  onConfigSet(config = {}) {
    this.setState(config);
    if (this.props.onConfigSet) {
      this.props.onConfigSet(config);
    }
  }

  async setDepartureTime() {
    const time = await this.pickTime(this.state.departureTime);
    if (!time) return;
    this.onConfigSet({departureTime: time, arrivalTime: null});
  }
  async setArrivalTime() {
    const time = await this.pickTime(this.state.arrivalTime);
    if (!time) return;
    this.onConfigSet({departureTime: null, arrivalTime: time});
  }
  async pickTime(defaultTime) {
    defaultTime = defaultTime || moment();
    const {action, hour, minute} = await TimePickerAndroid.open({
      hour: defaultTime.hour(),
      minute: defaultTime.minute(),
    });
    if (action === TimePickerAndroid.dismissedAction) return;
    let time = moment();
    time.hour(hour);
    time.minute(minute);
    if (time < moment()) {
      if (time.diff(moment(), 'minutes') >= -2) {
        time = moment();
      } else {
        time.add(1, 'day');
      }
    }
    return time;
  }
}

const styles = StyleSheet.create({
  directionConfig: {
    backgroundColor: '#689f38',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  directionConfigItem: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: 15,
    paddingTop: 5,
    borderBottomWidth: 5,
    borderColor: 'transparent',
  },
  directionConfigItemActive: {
    borderColor: '#aed581',
  },
  getDirectionsButton: {
    fontSize: 18,
    color: '#fff',
  },
  directionConfigTime: {
    color: '#fff',
  },
});
