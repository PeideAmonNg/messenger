import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import styles from './styles';

// headerRight can be a single object, an array of objects, or null.
export default makeHeader = (title, headerRight, opts) => {	
	if(headerRight) {
		// headerRight = Array.isArray(headerRight) ? headerRight.map(i => (i.key = i.text) && i) : (headerRight.key = headerRight.text) && [headerRight];
		headerRight = Array.isArray(headerRight) ? headerRight : [headerRight];

		var hr = (
			<View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
				{
					headerRight.map(i => 
						<TouchableOpacity 
							onPress={i.func}
							disabled={i.disabled}
							key={i.text}
						>
							<Text style={{color: styles.textColor, marginRight: 20}}>{i.text}</Text>
						</TouchableOpacity>
					)
				}
			</View>
		);		
	}

	return {
		title: title,
		headerRight: headerRight && hr,
		headerStyle: {
			backgroundColor: styles.mainColor,
		},
		headerTintColor: styles.textColor,
		headerTitleStyle: {
			fontWeight: 'normal'
		}
	}
};