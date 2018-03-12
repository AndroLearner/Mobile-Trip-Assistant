import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function StepsBreadcumb({steps, color='#333'}) {
  const items = [];
  if (!steps.some(step => step.travel_mode !== 'WALKING')) {
    // It's within walking distance. No transit involved.
    items.push(
      <Icon name="directions-walk" key={`i`} size={16} color={color} />
    );
    items.push(
      <Text key="t" style={{fontSize: 16, color}}>Walk to destination</Text>
    );
  } else {
    steps.forEach((step, i) => {
      if (step.travel_mode === 'WALKING') {
        const minutes = Math.round(step.duration.value / 60);
        if (minutes < 5) {
          // Don't bother showing very short walking steps.
          return;
        }
        items.push(
          <Icon name="directions-walk" key={`i-${i}`} size={16} color={color} />
        );
        items.push(
          <Text style={[styles.walkingLabel, {color}]} key={`l-${i}`}>{minutes}</Text>
        );
      } else if (step.travel_mode === 'TRANSIT') {
        items.push(
          <Icon name="directions-bus" key={`i-${i}`} size={16} color={color} />
        );
        const label = step.transit_details.line.short_name;
        items.push(
          <Text style={[styles.busLabel, {color}]} key={`l-${i}`}>{label}</Text>
        );
      } else {
        return;
      }
      items.push(<Icon name="chevron-right" key={`s-${i}`} size={16} />);
    });
    items.pop();
  }
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      {items}
    </View>
  );
};

const styles = StyleSheet.create({
  busLabel: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 5,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  walkingLabel: {
    paddingTop: 5,
    fontSize: 12,
  },
});
