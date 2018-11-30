import React, {Component} from 'react';
import {View, Text, AsyncStorage} from 'react-native';
import { List, ListItem, Header, Button, Icon, FormLabel, FormInput, Card} from 'react-native-elements'

export default class SettingScreen extends Component {
  state = {
    username: '',
    password: '',
  }

  componentDidMount() {
    const u = AsyncStorage.getItem('@BapID:key');
    u.then(username => this.setState({username}));
    const p = AsyncStorage.getItem('@Pass:key');
    p.then(password => this.setState({password}));
  }

  async _handleSetUser(user, pass) {
    try {
      await AsyncStorage.setItem('@BapID:key', user);
      await AsyncStorage.setItem('@Pass:key', pass);
      this.props.navigation.navigate('Home');
    } catch (error) {
      console.log(error);
    }
  }

  render() {
    const {username, password} = this.state;

    return (
      <View>
        <Header
          backgroundColor='#009688'
          // leftComponent={<Icon name='fingerprint' color='#fff' onPress={() => this.props.navigation.goBack()} />}
          centerComponent={{ text: 'SETTING', style: { color: '#fff' } }}
        />
        <Card title="PROFILE">
          <FormLabel>Bap ID:</FormLabel>
          <FormInput
            placeholder='Please enter your ID'
            inputStyle={{width: '100%', borderBottomWidth: 2, borderColor: '#ccc'}}
            value={username}
            onChangeText={(text) => this.setState({username: text.trim()})}/>
          <FormLabel>Password:</FormLabel>
          <FormInput
            placeholder='Please enter your Pass'
            secureTextEntry={true}
            inputStyle={{width: '100%', borderBottomWidth: 2, borderColor: '#ccc'}}
            value={password}
            onChangeText={(text) => this.setState({password: text.trim()})}/>
          <Button
            rounded
            icon={{name: 'save'}}
            backgroundColor='#ff5607'
            containerViewStyle={{marginTop: 10}}
            title="Save"
            onPress={() => this._handleSetUser(username, password)}
          />
        </Card>

      </View>
    );
  }
}
