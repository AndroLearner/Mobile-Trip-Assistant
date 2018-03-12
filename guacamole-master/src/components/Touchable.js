import React from 'react';
import { Platform, TouchableHighlight, TouchableNativeFeedback } from 'react-native';

export default function Touchable({highlightColor, ...props}) {
  if (Platform.OS === 'android') {
    let background = TouchableNativeFeedback.SelectableBackground();
    if (Platform['Version'] >= 21) {
      const rippleColor = highlightColor || 'rgba(0,0,0,0.2)';
      background = TouchableNativeFeedback.Ripple(rippleColor, false);
    }
    return <TouchableNativeFeedback background={background} {...props} />
  } else {
    return <TouchableHighlight underlayColor={highlightColor} {...props} />
  }
}
