import React from "react";
import { StyleSheet, Image, Dimensions, View } from "react-native";
import Lightbox from "./LightBox";

export default class App extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Lightbox
          activeProps={{
            width: null,
            flex: 1,
            resizeMode: "contain"
          }}
          springConfig={{
            // friction: 7,//Controls "bounciness"/overshoot. Default 7.
            // tension: 10, //Controls speed. Default 40.
            speed: 16, //Controls speed of the animation.Default 12.
            bounciness: 4 //Controls bounciness. Default 8.
          }}
        >
          <Image
            style={{ height: 300, width: 300 }}
            source={{
              uri:
                "http://knittingisawesome.com/wp-content/uploads/2012/12/cat-wearing-a-reindeer-hat1.jpg"
            }}
          />
        </Lightbox>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
