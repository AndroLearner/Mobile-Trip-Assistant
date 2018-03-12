/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import moment from 'moment';
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TimePickerAndroid,
  BackAndroid,
} from 'react-native';
import MapView from 'react-native-maps';
import polyline from 'polyline';
import ActionButton from 'react-native-action-button';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import * as mapsApi from './maps_api';
import { loadTrueTimeForRoutes, enableMockChanges } from './true_time_routes';
import myLocation from './my_location';
import DirectionConfig from './src/components/DirectionConfig';
import RouteList from './src/components/RouteList';
import RouteDetails from './src/components/RouteDetails';
import PlaceInput from './src/components/PlaceInput';
import Touchable from './src/components/Touchable';

export default class Guacamole extends Component {
  state = {mapPanned: false, startingPlace: {isMyLocation: true}};
  render() {
    const {routes, mapEnlarged, activeStep} = this.state;
    const showRoutes = this.state.showRoutes && !this.state.showRouteDetails;
    const showRouteDetails = this.state.showRouteDetails;
    const expandDirectionConfig = (showRoutes && this.state.startingPlace &&
      this.state.destinationPlace);
    const directionWrapperStyle = {};
    if (showRoutes) {
      directionWrapperStyle.bottom = 0;
    } else if (showRouteDetails) {
      directionWrapperStyle.top = -Dimensions.get('window').height;
      directionWrapperStyle.backgroundColor = '#f00';
    }
    const activeRoute = this.state.activeRoute || (routes && routes[0]);

    return (
      <View style={styles.container}>
        <MapView ref="map" style={styles.map}
          initialRegion={{
            latitude: 40.436541,
            longitude: -79.988817,
            latitudeDelta: 0.164623,
            longitudeDelta: 0.169515,
          }}
          toolbarEnabled={false}
          onPress={this.enlargeMap.bind(this)}
          onPanDrag={this.enlargeMap.bind(this)}
          onMarkerPress={this.enlargeMap.bind(this)}
          showsUserLocation={true}
        >
          {routes && this.state.routes.map((route, i) =>
            (!this.state.route || this.state.route === route) &&
            <MapView.Polyline
              key={i}
              coordinates={route.polylineCoords}
              strokeWidth={4}
              strokeColor={
                (route === activeRoute && !activeStep) ? '#8bc34a' : '#bdbdbd'}
              onPress={() => this.activateRoute(route)}
              zIndex={route === activeRoute ? 11 : 10}
            />
          )}
          {activeStep && (
            <MapView.Polyline
              coordinates={activeStep.polylineCoords}
              strokeWidth={4}
              strokeColor='#8bc34a'
              zIndex={12}
            />
          )}
          {this.state.startingPlace && !this.state.startingPlace.isMyLocation &&
            <MapView.Marker coordinate={this.state.startingPlace} zIndex={20} />
          }
          {this.state.destinationPlace != null && (
            <MapView.Marker
              pinColor="#8bc34a"
              coordinate={this.state.destinationPlace}
              zIndex={20}
            />
          )}
        </MapView>
        {showRouteDetails && (
          <View style={styles.backOverlay} pointerEvents="box-none">
            <LinearGradient style={styles.backOverlayGradient}
              colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)']}>
              <View>
                <Touchable onPress={() => this.closeRouteDetails()}>
                  <Icon name="arrow-back" color="#fff" size={24}
                    style={{padding: 8}} />
                </Touchable>
              </View>
            </LinearGradient>
          </View>
        )}
        {showRouteDetails && (
          <RouteDetails
            style={[styles.routeDetails, this.state.mapEnlarged ? {flex: null} : {}]}
            route={this.state.route || this.state.activeRoute}
            startingPlace={this.state.startingPlace}
            destinationPlace={this.state.destinationPlace}
            minimized={this.state.mapEnlarged}
            onPress={() => this.setState({mapEnlarged: false})}
            onStepSelected={this.activateStep.bind(this)}
            onPlaceSelected={(place) => this.showPointOnMap(place)}
          />
        )}
        <View style={[styles.directionWrapper, directionWrapperStyle]}>
          <View style={styles.directionOptions}>
            <View style={styles.directionOptionsRow}>
              <Text style={styles.directionOptionsLabel}>From:</Text>
              <PlaceInput
                style={{flex: 1}}
                place={this.state.startingPlace}
                placeholder="Choose starting point"
                onPlaceChange={this.onStartingPlaceChange.bind(this)}
              />
            </View>
            <View style={styles.directionOptionsRow}>
              <Text style={styles.directionOptionsLabel}>To:</Text>
              <PlaceInput
                style={{flex: 1}}
                place={this.state.destinationPlace}
                placeholder="Choose destination"
                onPlaceChange={this.onDestinationPlaceChange.bind(this)}
              />
            </View>
          </View>
          {this.state.startingPlace && this.state.destinationPlace && (
            <DirectionConfig
              expanded={this.state.placesConfirmed}
              onConfigSet={this.onDirectionConfigSet.bind(this)}
            />
          )}
          {showRoutes && (
            <RouteList
              style={{paddingBottom: 120}}
              routes={routes}
              serviceBulletins={this.state.serviceBulletins}
              onRouteSelected={(route) => this.onRouteSelected(route)}
            />
          )}
        </View>
        {this.state.placesConfirmed && routes && !showRouteDetails && (
          <ActionButton
            buttonColor="#8bc34a"
            onPress={() => this.setState({showRoutes: !showRoutes})}
            icon={showRoutes ?
              <MCIcon name="google-maps" color="#fff" size={28} /> :
              <Icon name="directions" color="#fff" size={28} />
            }
            onLongPress={this.toggleMockData.bind(this)}
          />
        )}
      </View>
    );
  }
  componentDidMount() {
    this.findMyLocation();
    BackAndroid.addEventListener('hardwareBackPress', () => {
      if (this.state.showRouteDetails) {
        this.closeRouteDetails();
        return true;
      }
      if (this.state.showRoutes) {
        this.setState({showRoutes: false});
        return true;
      }
      return false;
    });
  }
  async onDirectionConfigSet(config) {
    this.setState({...config, placesConfirmed: true});
    this.getDirections();
  }
  async getDirections() {
    this.setState({routes: null, showRoutes: true});
    let {departureTime, arrivalTime} = this.state;
    let {startingPlace} = this.state;
    if (startingPlace.isMyLocation) {
      if (!myLocation.isReady) {
        try {
          await timeout(this.findMyLocation(), 10000);
        } catch (_) {
        }
        if (!myLocation.isReady) {
          alert('Cannot obtain your location. Please retry.');
          this.setState({showRoutes: false, placesConfirmed: false});
          return;
        }
      }
      startingPlace = {
        isMyLocation: true,
        ...myLocation.position.coords,
      };
      this.setState({startingPlace});
    }
    let origin = null;
    if (startingPlace.placeID) {
      origin = 'place_id:' + startingPlace.placeID;
    } else if (startingPlace.latitude) {
      origin = startingPlace.latitude + ',' + startingPlace.longitude;
    } else {
      throw new Error('Cannot handle origin!');
    }
    const {places, routes, status} = await mapsApi.getDirections({
      origin,
      destination: 'place_id:' + this.state.destinationPlace.placeID,
      departureTime,
      arrivalTime,
    });
    this.setState({places});
    this.showPlacesOnMap(places);

    if (status === 'NOT_FOUND') {
      // TODO: Display error and let users modify the points.
      throw new Error(status);
    } else if (status === 'ZERO_RESULTS' || routes.length === 0) {
      // TODO: Show there are no results to the user.
      throw new Error(result.status);
    } else if (status === 'MAX_ROUTE_LENGTH_EXCEEDED') {
      // TODO: Show route is too long to the user.
      throw new Error(result.status);
    }
    let serviceBulletins;
    try {
      ({serviceBulletins} = await loadTrueTimeForRoutes(routes,
        departureTime, arrivalTime));
    } catch (err) {
      console.log('TrueTime error: ', err);
    }
    for (const route of routes) {
      const pairs = polyline.decode(route.overview_polyline.points);
      const coordinates = pairs.map(mapsApi.parseLatLng);
      route.polylineCoords = coordinates;
    }
    this.setState({routes, serviceBulletins});
  }
  activateRoute(route, state = {}) {
    this.setState({
      showRouteDetails: true,
      mapEnlarged: true,
      activeRoute: route,
      ...state,
    });
    const {southwest, northeast} = route.bounds;
    setTimeout(() => {
      this.refs.map.fitToCoordinates(this.state.places.concat([
        mapsApi.parseLatLng(southwest),
        mapsApi.parseLatLng(northeast),
      ]), {animated: true});
    }, 300);
  }
  activateStep(step) {
    if (!step.polylineCoords) {
      const pairs = polyline.decode(step.polyline.points);
      step.polylineCoords = pairs.map(mapsApi.parseLatLng);
    }
    this.setState({
      route: this.state.route || this.state.activeRoute,
      activeStep: step,
      mapEnlarged: true,
    });
    this.refs.map.fitToCoordinates(step.polylineCoords, {animated: true});
  }
  onRouteSelected(route, showMap = false) {
    this.activateRoute(route, {route, mapEnlarged: false});
  }
  closeRouteDetails() {
    this.setState({
      showRouteDetails: false,
      activeStep: null,
      route: null,
      activeRoute: null,
    });
  }
  enlargeMap() {
    if (this.state.showRouteDetails != null) {
      this.setState({mapEnlarged: true})
    }
  }
  showPlacesOnMap(places) {
    const fitPlaces = places.filter(p => p != null);
    if (fitPlaces.length) {
      this.refs.map.fitToCoordinates(fitPlaces, {animated: true});
    }
  }
  setPlaces(places) {
    this.setState({
      ...places,
      showRoutes: false,
      placesConfirmed: false,
      routes: null,
      route: null,
    });
  }
  onStartingPlaceChange(place) {
    const places = {startingPlace: place};
    if (this.state.destinationPlace &&
        this.state.destinationPlace.placeID === place.placeID) {
      places.destinationPlace = null;
    }
    this.setPlaces(places);
    this.showPointOnMap(place);
  }
  onDestinationPlaceChange(place) {
    const places = {destinationPlace: place};
    if (this.state.startingPlace &&
        this.state.startingPlace.placeID === place.placeID) {
      places.startingPlace = null;
    }
    this.setPlaces(places);
    this.showPointOnMap(place);
  }
  showPointOnMap(point) {
    this.setState({mapPanned: true});
    // this.refs.map.animateToCoordinate(place);
    this.refs.map.animateToRegion({
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }
  showCurrentLocationOnMap() {
    if (!this.state.mapPanned) {
      this.showPointOnMap(myLocation.position.coords);
      this.state.mapPanned = true;
    }
  }
  findMyLocation() {
    myLocation.getInitialLocation(
    ).catch(() => null);
    myLocation.watchLocation();
    return myLocation.availablePromise.then(() => {
      this.showCurrentLocationOnMap();
    });
  }
  toggleMockData() {
    this['_magic_' + !!this.state.showRoutes] = true;
    if (this._magic_true && this._magic_false) {
      alert('Mock data enabled!');
      enableMockChanges();
      this.setState({placesConfirmed: false, showRoutes: false});
    }
  }
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    promise.then(resolve, reject);
    setTimeout(() => reject(new Error('Timed out.')), ms);
  });
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#f5fcff',
  },
  directionWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  directionOptions: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#8bc34a',
  },
  directionOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingVertical: 5,
  },
  directionOptionsLabel: {
    width: 60,
    color: '#fff',
    fontSize: 16,
    padding: 5,
  },
  map: {
    flex: 1,
  },
  routeDetails: {
    flex: 3,
  },
  backOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'stretch',
  },
  backOverlayGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
});

AppRegistry.registerComponent('guacamole', () => Guacamole);
