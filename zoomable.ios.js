import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { ScrollView, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    flex: 1
  }
});

export default class Zoomable extends PureComponent {
  state = {
    maximumZoomScale: 3,
    minimumZoomScale: 1
  };

  render() {
    return (
      <ScrollView
        centerContent
        contentContainerStyle={styles.contentContainer}
        maximumZoomScale={this.state.maximumZoomScale}
        minimumZoomScale={this.state.minimumZoomScale}
        style={this.props.style || styles.container}
      >
        {this.props.children}
      </ScrollView>
    );
  }
}
