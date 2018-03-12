import React from 'react';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import humanizeDuration from 'humanize-duration';

export default function LeaveHint({time, style}) {
  const diffMs = time.value * 1000 - Date.now();
  let durationText = 'NOW';
  if (diffMs <= -2 * 60 * 1000 || diffMs >= 3 * 60 * 60 * 1000) {
    return <Text />;
  } else if (diffMs >= 60 * 1000) {
    const diff = humanizeDuration(diffMs, {
      delimiter: ' ',
      units: ['h', 'm'],
      round: true,
    });
    durationText = 'in ' + diff;
  }
  return (
    <Text style={style}>
      <Text>Leave </Text>
      <Text style={{color: "#8bc34a"}}>{durationText}</Text>
      {(time.isHighAccuracy || time.isAdjusted) && (
        <Icon name="rss-feed" color="#8bc34a" size={16} />
      )}
      <Text> to catch the bus</Text>
    </Text>
  );
}
