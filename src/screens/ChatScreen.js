import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { GiftedChat, Actions, Bubble } from 'react-native-gifted-chat';
import CustomView from '../components/CustomView';
import * as actions from '../actions';


class ChatScreen extends Component {
  static navigatorButtons = {
    rightButtons: [
      {
        title: 'Logout',
        id: 'logout'
      }
    ]
  };

  static navigatorStyle = {
    navBarHidden: false,
    statusBarColor: '#36648B',
    statusBarTextColorScheme: 'light',
    navBarBackgroundColor: Platform.OS === 'ios' ? '#f7f7f7' : '#517fa4',
    navBarTextColor: Platform.OS === 'ios' ? '#000000' : '#ffffff',
    navBarButtonColor: Platform.OS === 'ios' ? '#007aff' : '#ffffff',
    topBarElevationShadowEnabled: true,
    navBarHideOnScroll: false
  };

  constructor(props) {
    super(props);
    this.state = {
      isLoadingEarlier: false
    };

    // if you want to listen on navigator events, set this up
    this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
  }

  componentWillMount() {
    this.props.getUserData();
    this.props.fetchMessages();
  }

  componentDidMount() {
    this.props.listenMessages();
  }

  componentWillUnmount() {
    this.props.disconnectListenMessages();
  }

  onNavigatorEvent(event) { // this is the onPress handler for the two buttons together
    if (event.type === 'NavBarButtonPress') { // this is the event type for button presses
      if (event.id === 'logout') { // this is the same id field from the static navigatorButtons definition
        this.logout();
      }
    }
  }

  async onLoadEarlier() {
    this.setState({ isLoadingEarlier: true });
    await this.props.fetchMessages(this.props.messages[this.props.messages.length - 1].key);
    setTimeout(() => { this.setState({ isLoadingEarlier: false }); }, 500);
  }

  async logout() {
    await this.props.logout();
    this.props.navigator.resetTo({
      screen: 'ReactNativePOC.LoginScreen',
      animated: true
    });
  }

  async sendMessage(messages) {
    const text = messages[0].text;
    const message = {
      user: {
        _id: this.props.id,
        name: this.props.name,
        avatar: this.props.avatar
      },
      type: 'text',
      text,
      createdAt: new Date().getTime()
    };

    await this.props.sendMessage(message);
  }

  renderCustomActions(props) {
    const options = {
      'Send audio': () => {
        this.props.navigator.showModal({
          screen: 'ReactNativePOC.RecordingScreen',
          title: 'Audio recording'
        });
      },
      Cancel: () => {},
    };

    return (
      <Actions
        {...props}
        options={options}
      />
    );
  }

  renderCustomView(props) {
    return (
      <CustomView
        {...props}
      />
    );
  }

  renderUsername(currentMessage) {
    if (currentMessage.user._id !== this.props.id) { // eslint-disable-line
      return <Text style={styles.username}>{currentMessage.user.name}</Text>;
    }

    return null;
  }

  renderBubble(props) {
    if (props.isSameUser(props.currentMessage, props.previousMessage) && props.isSameDay(props.currentMessage, props.previousMessage)) {
      return (
        <Bubble
          {...props}
        />
      );
    }

    return (
      <View>
        {this.renderUsername(props.currentMessage)}
        <Bubble
          {...props}
        />
      </View>
    );
  }

  render() {
    if (this.props.loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size='large' />
        </View>
      );
    }

    return (
      <GiftedChat
        messages={this.props.messages}
        onSend={(messages) => this.sendMessage(messages)}
        loadEarlier={this.props.loadEarlier}
        onLoadEarlier={this.onLoadEarlier.bind(this)}
        isLoadingEarlier={this.state.isLoadingEarlier}
        renderActions={this.renderCustomActions.bind(this)}
        renderCustomView={this.renderCustomView}
        renderBubble={this.renderBubble.bind(this)}
        user={{
          _id: this.props.id,
        }}
      />
    );
  }
}

const styles = {
  username: {
    color: 'grey'
  }
};

const mapStateToProps = (state) => {
  const { messages, loading, loadEarlier } = state.firebase;
  const { name, avatar, id, authorized } = state.user;
  return { messages, id, name, avatar, authorized, loading, loadEarlier };
};

export default connect(mapStateToProps, actions)(ChatScreen);
