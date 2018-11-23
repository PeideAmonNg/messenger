import React, {Component} from 'react';
import {createBottomTabNavigator, createStackNavigator, createSwitchNavigator, createMaterialTopTabNavigator} from 'react-navigation';

import {ReceivedScreen, SentScreen} from './screens/Home';
import NewPostcardScreen from './screens/NewPostcard';
import {FriendsScreen} from './screens/Friends';
import {ExploreScreen} from './screens/Explore';
import {SettingsScreen, UpdateProfileScreen} from './screens/Settings';
import {AuthLoadingScreen} from './screens/Auth';
import {UserScreen} from './screens/User';

import styles from './styles';
import makeHeader from './header';

let home = createMaterialTopTabNavigator({
	Received: ReceivedScreen,
	Sent: SentScreen
}, {
	tabBarOptions: {
		activeTintColor: styles.mainColor,		
		inactiveTintColor: 'lightgray',
		style: {
			backgroundColor: 'white',
		},
		indicatorStyle: {
			backgroundColor: styles.mainColor
		}
	}
});

home.navigationOptions = ({ navigation, screenProps }) => 
	makeHeader('Inbox', {text: 'New', func: () => navigation.navigate('NewPostcard')});

let app = createBottomTabNavigator({
	Home: createStackNavigator({
		Home: home,
		NewPostcard: NewPostcardScreen
	}),
	Friends: createStackNavigator({
		Friends: FriendsScreen,
		Friend: UserScreen
	}),
	Explore: createStackNavigator({
		Explore: ExploreScreen,
		User: UserScreen
	}),
  Settings: createStackNavigator({
		Settings: SettingsScreen,
		UpdateProfile: UpdateProfileScreen
	}),
}, {
	tabBarOptions: {
		activeTintColor: styles.mainColor
	}
});

export default createSwitchNavigator({
	Auth: AuthLoadingScreen,
	App: app
})

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   welcome: {
//     fontSize: 20,
//     textAlign: 'center',
//     margin: 10,
//   },
//   instructions: {
//     textAlign: 'center',
//     color: '#333333',
//     marginBottom: 5,
//   },
// });
