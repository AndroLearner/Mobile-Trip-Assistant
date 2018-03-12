import React from 'react';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function TimeDisp({time, style}) {
  if (!time) return <Text />;
  return (
    <Text style={style}>
      <Text>{time.text}</Text>
      {time.isHighAccuracy && (
        <Icon name="rss-feed" color="#8bc34a" size={16} />
      )}
    </Text>
  );
}
