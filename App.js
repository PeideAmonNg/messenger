import React, {Component} from 'react';
import {createBottomTabNavigator, createStackNavigator, createSwitchNavigator, createMaterialTopTabNavigator} from 'react-navigation';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {ReceivedScreen, SentScreen} from './screens/Home';
import {FriendsScreen} from './screens/Friends';
import {ExploreScreen} from './screens/Explore';
import {SettingsScreen, UpdateProfileScreen} from './screens/Settings';
import {AuthLoadingScreen} from './screens/Auth';
import {UserScreen} from './screens/User';
import {ThreadListScreen, SelectUsersScreen} from './screens/Threads';
import {ThreadScreen} from './screens/Thread';

import styles from './styles';
import makeHeader from './header';

let home = createMaterialTopTabNavigator({
	Received: ReceivedScreen,
	Sent: SentScreen
}, {
	tabBarOptions: {
		activeTintColor: 'black',		
		inactiveTintColor: 'gray',
		style: {
			backgroundColor: 'white',
		},
		indicatorStyle: {
			backgroundColor: 'black'
		}
	}
});

home.navigationOptions = ({ navigation, screenProps }) => 
	makeHeader('Postcards', {text: 'New', func: () => navigation.navigate('NewPostcard')});

let app = createBottomTabNavigator({
	Messages: createStackNavigator({
		ThreadList: ThreadListScreen,
		Thread: ThreadScreen,
		SelectUsers: SelectUsersScreen
	}),
	Friends: createStackNavigator({
		Friends: FriendsScreen,
		Friend: UserScreen
	}),
	Community: createStackNavigator({
		Explore: ExploreScreen,
		User: UserScreen
	}),
  Profile: createStackNavigator({
		Settings: SettingsScreen,
		UpdateProfile: UpdateProfileScreen
	}),
},
{
	navigationOptions: ({ navigation }) => ({
		tabBarIcon: ({ focused, horizontal, tintColor }) => {
			const { routeName } = navigation.state;
			let iconName;
			console.log(routeName);
			if (routeName === 'Messages') {
				iconName = 'message-outline';
			} else if(routeName === 'Friends') {
				iconName = 'account-multiple-outline';
			} else if(routeName === 'Community') {
				iconName = 'account-search-outline';
			} else if(routeName === 'Profile') {
				iconName = 'settings-outline';
			}

			// You can return any component that you like here!
			return <Icon name={iconName} size={20} color={tintColor} />
		},
	}),
	tabBarOptions: {
		activeTintColor: '#474747',
		inactiveTintColor: 'lightgray',
		showLabel: false
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
