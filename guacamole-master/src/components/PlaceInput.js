import React, { Component } from 'react';
import RNGooglePlaces from 'react-native-google-places';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Touchable from './Touchable';

export default class PlaceInput extends Component {
  state = {};
  render() {
    let text;
    let color = '#333';
    if (this.props.place) {
      if (this.props.place.isMyLocation) {
        text = 'Your location';
      } else {
        text = this.props.place.name || this.props.place.address;
      }
    } else {
      text = this.props.placeholder || 'Pick a place...';
      color = '#666';
    }
    return (
      <Touchable onPress={() => this.openSearchModal()}>
        <View style={[styles.placeInputTouch, this.props.style]}>
          {this.props.place && this.props.place.isMyLocation && (
            <Icon name="my-location" color="#333" size={16}
              style={{paddingRight: 5}} />
          )}
          <Text style={{color, fontSize: 16}}>{text}</Text>
        </View>
      </Touchable>

    );
  }
  async openSearchModal() {
    let place;
    try {
      place = await RNGooglePlaces.openAutocompleteModal();
    } catch (e) {
      if (e.message === 'Search cancelled') {
        return;
      }
      throw e;
    }
    if (!this.props.place || this.props.place.placeID !== place.placeID) {
      const onPlaceChange = this.props.onPlaceChange;
      if (onPlaceChange) {
        onPlaceChange(place);
      }
    }
  }
}

const styles = StyleSheet.create({
  placeInputTouch: {
    backgroundColor: '#fff',
    padding: 5,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
