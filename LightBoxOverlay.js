import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Zoomable from "./zoomable.ios";

const WINDOW_HEIGHT = Dimensions.get("window").height;
const WINDOW_WIDTH = Dimensions.get("window").width;
const DRAG_DISMISS_THRESHOLD = 150;
const STATUS_BAR_OFFSET = Platform.OS === "android" ? -25 : 0;
const isIOS = Platform.OS === "ios";

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT
  },
  open: {
    position: "absolute",
    flex: 1,
    justifyContent: "center",
    // Android pan handlers crash without this declaration:
    backgroundColor: "transparent"
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    width: WINDOW_WIDTH,
    backgroundColor: "transparent"
  },
  closeButton: {
    fontSize: 35,
    color: "white",
    lineHeight: 40,
    width: 40,
    textAlign: "center",
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowRadius: 1.5,
    shadowColor: "black",
    shadowOpacity: 0.8
  }
});

export default class LightboxOverlay extends Component {
  static propTypes = {
    origin: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      width: PropTypes.number,
      height: PropTypes.number
    }),
    springConfig: PropTypes.shape({
      tension: PropTypes.number,
      friction: PropTypes.number
    }),
    backgroundColor: PropTypes.string,
    isOpen: PropTypes.bool,
    renderHeader: PropTypes.func,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    willClose: PropTypes.func,
    swipeToDismiss: PropTypes.bool
  };

  static defaultProps = {
    springConfig: { tension: 30, friction: 7 },
    backgroundColor: "black"
  };

  constructor(props) {
    super(props);

    this.isOnePin = false;
    this.state = {
      isAnimating: false,
      isPanning: false,
      isClosing: false,
      target: {
        x: 0,
        y: 0,
        opacity: 1
      },
      scale: new Animated.Value(1),
      pan: new Animated.Value(0),
      openVal: new Animated.Value(0),
      left: new Animated.Value(0)
    };
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => {
        return !this.state.isAnimating;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) =>
        !this.state.isAnimating,
      onMoveShouldSetPanResponder: (evt, gestureState) =>
        //事件不可穿透
        false,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
        !this.state.isAnimating,

      onPanResponderGrant: (evt, gestureState) => {
        this.state.pan.setValue(0);
        this.state.left.setValue(0);
        this.state.scale.setValue(1);
        this.setState({ isPanning: true });
      },
      onPanResponderMove: (evt, gestureState) => {
        this.state.pan.setValue(gestureState.dy);
        this.state.left.setValue(gestureState.dx);
        this.state.scale.setValue(
          1 - Math.abs(gestureState.dy / (WINDOW_WIDTH * 2))
        );

        if (gestureState.dx !== 0 || gestureState.dy !== 0) {
          this.isOnePin = false;
        } else {
          this.isOnePin = true;
        }
      },
      // 如果想要缩放，可以使用这里 = true
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        if (
          Math.abs(gestureState.dy) > DRAG_DISMISS_THRESHOLD ||
          this.isOnePin === true
        ) {
          this.setState({
            isPanning: false,
            target: {
              y: gestureState.dy,
              x: gestureState.dx,
              opacity: 1 - Math.abs(gestureState.dy / WINDOW_HEIGHT)
            }
          });
          this.close();
          this.isMoved = false;
        } else {
          Animated.stagger(0, [
            Animated.spring(this.state.pan, {
              toValue: 0,
              ...this.props.springConfig
            }),
            Animated.spring(this.state.left, {
              toValue: 0,
              ...this.props.springConfig
            }),
            Animated.spring(this.state.scale, {
              toValue: 1,
              ...this.props.springConfig
            })
          ]).start(() => this.setState({ isPanning: false }));
        }
      }
    });
  }

  componentDidMount() {
    if (this.props.isOpen) {
      this.open();
    }
  }

  open = () => {
    if (isIOS) {
      StatusBar.setHidden(true, "fade");
    } else {
      StatusBar.setBackgroundColor("black", true);
      StatusBar.setBarStyle("dark-content", true);
    }
    this.state.pan.setValue(0);
    this.setState({
      isAnimating: true,
      target: {
        x: 0,
        y: 0,
        opacity: 1
      }
    });

    Animated.spring(this.state.openVal, {
      toValue: 1,
      ...this.props.springConfig
    }).start(() => {
      this.setState({ isAnimating: false });
      this.props.didOpen();
    });
  };

  close = () => {
    this.props.willClose();
    if (isIOS) {
      StatusBar.setHidden(false, "fade");
    } else {
      StatusBar.setBackgroundColor("white", true);
      StatusBar.setBarStyle("dark-content", true);
    }
    this.setState({
      isAnimating: true,
      isClosing: true
    });

    Animated.stagger(0, [
      Animated.spring(this.state.openVal, {
        toValue: 0,
        ...this.props.springConfig
      }),
      Animated.spring(this.state.scale, {
        toValue: 1,
        ...this.props.springConfig
      })
    ]).start(() => {
      this.setState({
        isAnimating: false,
        isClosing: false
      });
      this.props.onClose();
    });
  };

  componentWillReceiveProps(props) {
    if (this.props.isOpen != props.isOpen && props.isOpen) {
      this.open();
    }
  }

  render() {
    const {
      isOpen,
      renderHeader,
      swipeToDismiss,
      origin,
      backgroundColor,
      originStyle
    } = this.props;

    const { isPanning, isAnimating, openVal, target } = this.state;

    const lightboxOpacityStyle = {
      opacity: openVal.interpolate({
        inputRange: [0, 1],
        outputRange: [0, target.opacity]
      })
    };

    let handlers;
    if (swipeToDismiss) {
      handlers = this._panResponder.panHandlers;
    }

    let dragStyle;
    if (isPanning) {
      dragStyle = {
        top: this.state.pan,
        left: this.state.left,
        transform: [{ scale: this.state.scale }]
      };
      lightboxOpacityStyle.opacity = this.state.pan.interpolate({
        inputRange: [-WINDOW_HEIGHT, 0, WINDOW_HEIGHT],
        outputRange: [0, 1, 0]
      });
    } else {
      dragStyle = {
        transform: [{ scale: this.state.scale }]
      };
    }

    const openStyle = [
      styles.open,
      {
        left: openVal.interpolate({
          inputRange: [0, 1],
          outputRange: [origin.x, target.x]
        }),
        top: openVal.interpolate({
          inputRange: [0, 1],
          outputRange: [
            origin.y + STATUS_BAR_OFFSET,
            target.y + STATUS_BAR_OFFSET
          ]
        }),
        width: openVal.interpolate({
          inputRange: [0, 1],
          outputRange: [origin.width, WINDOW_WIDTH]
        }),
        height: openVal.interpolate({
          inputRange: [0, 1],
          outputRange: [origin.height, WINDOW_HEIGHT]
        })
      }
    ];

    const background = (
      <Animated.View
        style={[
          styles.background,
          { backgroundColor: backgroundColor },
          lightboxOpacityStyle
        ]}
      />
    );
    const header = (
      <Animated.View style={[styles.header, lightboxOpacityStyle]}>
        {renderHeader ? (
          renderHeader(this.close)
        ) : (
          <TouchableOpacity onPress={this.close}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );

    const Chilren = this.state.isClosing
      ? this.props.originStyle
        ? React.cloneElement(this.props.children, {
            style: originStyle
          })
        : this.props.children
      : this.props.children;

    const content = this.state.isClosing ? (
      <Animated.View style={[openStyle, dragStyle]} {...handlers}>
        {Chilren}
      </Animated.View>
    ) : (
      <Zoomable ref={node => (this.Zoomable = node)}>
        <Animated.View style={[openStyle, dragStyle]} {...handlers}>
          {Chilren}
        </Animated.View>
      </Zoomable>
    );

    if (this.props.navigator) {
      return (
        <View>
          {background}
          {content}
          {header}
        </View>
      );
    }

    return (
      <Modal
        visible={isOpen}
        transparent={Platform.select({ ios: true, android: true })}
        onRequestClose={() => this.close()}
      >
        {background}
        {content}
        {header}
      </Modal>
    );
  }
}
