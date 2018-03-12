import Frisbee from 'frisbee';
import RNGooglePlaces from 'react-native-google-places';

export const googleMapsApi = new Frisbee({
  baseURI: 'https://maps.googleapis.com/maps/api/',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const apiKey = 'AIzaSyCuMk7MDN9Je8x56mCctKad7AbvpQ4w46Y';

export async function getDirections({origin, destination, departureTime,
    arrivalTime}) {
  if (departureTime && typeof departureTime === 'object') {
    departureTime = departureTime.unix();
  }
  if (arrivalTime && typeof arrivalTime === 'object') {
    arrivalTime = arrivalTime.unix();
  }
  const result = await googleMapsApi.get('directions/json', {
    body: {
      origin,
      destination,
      key: apiKey,
      mode: 'transit',
      transit_mode: 'bus',
      alternatives: true,
      departure_time: departureTime ? departureTime : undefined,
      arrival_time: (!departureTime && arrivalTime) ? arrivalTime : undefined,
      // transit_routing_preference: 'less_walking', 'fewer_transfers'
    },
  });
  switch (result.body.status) {
    case 'OK':
      const places = await getPlacesFromWaypoints(
        result.body.geocoded_waypoints);
      return {
        places,
        routes: result.body.routes,
      };
    case 'NOT_FOUND':
    case 'ZERO_RESULTS':
    case 'MAX_WAYPOINTS_EXCEEDED':
    case 'MAX_ROUTE_LENGTH_EXCEEDED':
      // geocoded_waypoints may still contain some results.
      if (result.body.geocoded_waypoints) {
        const places = await getPlacesFromWaypoints(
          result.body.geocoded_waypoints);
        return {
          places,
          error: result.body.status,
        };
      } else {
        return {
          error: result.body.status,
        };
      }
    case 'INVALID_REQUEST':
    case 'REQUEST_DENIED':
      throw new Error(result.body.error_message ||
        JSON.stringify(result.body));
    case 'OVER_QUERY_LIMIT':
      // TODO: Wait a moment and retry.
      throw new Error(result.body.status);
    case 'UNKNOWN_ERROR':
      // TODO: Automatic retry?
      throw new Error(result.body.error_message ||
        JSON.stringify(result.body));
    default:
      throw new Error(result.body.status);
  }
}

export function getPlaceById(placeId) {
  return RNGooglePlaces.lookUpPlaceByID(placeId);
}

async function getPlacesFromWaypoints(geocoded_waypoints) {
  const places = [];
  for (const waypoint of geocoded_waypoints) {
    if (waypoint.geocoder_status !== 'OK') {
      places.push(null);
    } else {
      const place = await RNGooglePlaces.lookUpPlaceByID(waypoint.place_id);
      if (waypoint.partial_match) {
        place.fuzzy = true;
      }
      places.push(place);
    }
  }
  return places;
}

export function parseLatLng(latLng) {
  if (Array.isArray(latLng)) {
    return {
      latitude: latLng[0],
      longitude: latLng[1],
    };
  }
  return {
    latitude: latLng.lat,
    longitude: latLng.lng,
  };
}
