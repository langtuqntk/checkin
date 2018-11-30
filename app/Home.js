/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, ScrollView, RefreshControl, Alert, AsyncStorage} from 'react-native';
import Toast from 'react-native-simple-toast';
import { List, ListItem, Header, Button, Icon} from 'react-native-elements'
import moment from 'moment';
import RNAppShortcuts from 'react-native-app-shortcuts';

const getToken = async (n) => {
  const username = await AsyncStorage.getItem('@BapID:key');
  const password = await AsyncStorage.getItem('@Pass:key');
  if(!username || !password) {
    if(n) n.navigate('Settings');
  }

  const params = {
    action: "get_oauth_token",
    grantData: [username, password],
    grantType: "password"
  }
  const rawResponse = await fetch('https://api.checkin.bap.jp/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ''
    },
    body: JSON.stringify(params)
  });
  const content = await rawResponse.json();

  return content;
};

const fetchTimeSheet = async (c, token) => {
  const params = {
    action: "personal_timesheet",
  }

  c.setState({isFetching: true});
  const rawResponse = await fetch('https://api.checkin.bap.jp/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(params)
  });
  c.setState({refreshing: false});
  const content = await rawResponse.json();
  return content;
}

const claimForPresence = async (token) => {
  const params = {
    action: "claim_for_presence",
  }
  const rawResponse = await fetch('https://api.checkin.bap.jp/api/rpc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify(params)
  });
  const content = await rawResponse.json();
  return content;
}

if(Platform.OS === "android" && Platform.Version >= 25) {
  RNAppShortcuts.addShortcut({
    id: 'id1',
    shortLabel: 'Check In',
    longLabel: 'Claim for presence',
    iconFolderName: 'drawable',
    iconName: 'checkin'
  })

  RNAppShortcuts.handleShortcut(function(id) {
    const p = getToken();
    p.then(data => {
      if(data.success) {
        const p2 = claimForPresence(data.result.token);
        p2.then(data => data.success && Toast.show('Checkin Success.', Toast.Long));
      }
    });
  })
}

type Props = {};
export default class Home extends Component<Props> {

  state = {
    token: '',
    timesheet: [],
    refreshing: false,
  }

  componentDidMount() {
    const {navigation} = this.props;
    const p = getToken(navigation);
    p.then(data => {
      if(data.success) {
        this.setState({token: data.result.token});
        const p2 = fetchTimeSheet(this, data.result.token);
        p2.then(data2 => data2.success && this.setState({timesheet: data2.result.time_sheet}));
      }
    });
  }

  _handleClaimForPresence(token) {
    const p = claimForPresence(token);
    p.then(data => {
      if(data.success) {
        Toast.show('Success.', Toast.LONG);
        this._onRefresh(token);
      }
      else {
        Alert.alert('Error', data.error.code);
      }
    })
  }

  _onRefresh(token) {
    this.setState({refreshing: true})
    const p = fetchTimeSheet(this, token);
    p.then(data => data.success && this.setState({timesheet: data.result.time_sheet}));
  }

  render() {
    const {token, timesheet, isFetching} = this.state;
    const startTime = moment('08:00:00','HH:mm:ss');
    const endTime = moment('17:15:00', 'HH:mm:ss');

    return (
      <View>
        <Header
          backgroundColor='#009688'
          // leftComponent={{ icon: 'home', color: '#fff'}}
          centerComponent={{ text: 'PERSONAL TIMESHEET', style: { color: '#fff' } }}
          // rightComponent={<Icon name='edit' color='#fff' onPress={() => this.props.navigation.navigate('Setting')} />}
        />
        <View style={{marginTop: 10}}>
          <Button
            raised
            large
            icon={{name: 'access-alarm'}}
            backgroundColor='#ff5607'
            title="Claim For Presence"
            onPress={() => this._handleClaimForPresence(token)}
          />
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={() => this._onRefresh(token)}
            />
          }
        >
          {timesheet.length > 0 &&
            <List>
            {
              timesheet.map((item, index) => {
                const checkInTime = moment(item.check_in_time).format('HH:mm:ss');
                const checkOutTime = moment(item.check_out_time).format('HH:mm:ss');

                const checkInColor = moment(checkInTime, 'HH:mm:ss').isBefore(startTime) ? 'green' : 'red';
                const checkOutColor = moment(checkOutTime, 'HH:mm:ss').isAfter(endTime) ? 'green' : 'red';

                return (
                  <ListItem
                    key={index}
                    title={`Date: ${moment(item.work_day).format('YYYY-MM-DD')}`}
                    rightIcon={{name: 'av-timer'}}
                    subtitle={
                      <View style={styles.subtitleView}>
                        <Text style={styles.ratingText}>Check in: <Text style={{color: checkInColor}}>{checkInTime}</Text></Text>
                        <Text style={styles.ratingText}>Check out: <Text style={{color: checkOutColor}}>{checkOutTime}</Text></Text>
                      </View>
                    }
                  />
                )
              })
            }
            </List>
          }
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  subtitleView: {
    flexDirection: 'row',
    paddingLeft: 0,
    paddingTop: 5
  },
  ratingImage: {
    height: 19.21,
    width: 100
  },
  ratingText: {
    paddingLeft: 10,
    color: 'grey'
  },
});
