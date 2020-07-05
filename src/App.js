import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/react-hooks";
import { distance, circle as create_circle } from "@turf/turf";
import MapView from "./components/MapView";
import Photos from "./components/Photos";
import { gql } from "apollo-boost";
import Source from "./components/Source";
import Layer from "./components/Layer";

const IMAGES = gql`
  query Images($center: InputLatLng!, $radius: Float!) {
    images(center: $center, radius: $radius) {
      url
      location {
        lat
        lng
      }
    }
  }
`;

const App = () => {
  const [center, setCenter] = useState(null);
  const [radius, setRadius] = useState(null);
  const { loading, error, data } = useQuery(IMAGES, {
    variables: { center, radius },
    skip: !center || !radius,
  });

  let circle = useMemo(
    () =>
      !center || !radius
        ? null
        : create_circle([center.lng, center.lat], radius, {
            units: "kilometers",
          }),
    [center, radius]
  );

  let images = data?.images || [];

  return (
    <div>
      <MapView
        onMoveEnd={(map, event) => {
          let center = map.getCenter();
          let bounds = map.getBounds();

          let bottom = {
            lng: bounds._sw.lng,
            lat: center.lat,
          };

          let right = {
            lng: center.lng,
            lat: bounds._ne.lat,
          };

          let radius = Math.min(
            distance([center.lng, center.lat], [bottom.lng, bottom.lat]),
            distance([center.lng, center.lat], [right.lng, right.lat])
          ); // km

          setCenter(center);
          setRadius(radius);
        }}
      >
        <Source id="circy" type="geojson" data={circle} />
        <Layer
          id="circy2"
          type="fill"
          source="circy"
          paint={{
            "fill-color": "#088",
            "fill-opacity": 0.8,
          }}
        />
        <Source
          id="images"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: images.map(({ location: { lat, lng } }) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [lng, lat],
              },
              properties: {
                title: "Photo",
                icon: "monument",
              },
            })),
          }}
        />
        <Layer
          id="images2"
          type="symbol"
          source="images"
          layout={{
            "icon-image": ["concat", ["get", "icon"], "-15"],
            "text-field": ["get", "title"],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top",
            visibility: "visible",
          }}
        />
      </MapView>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          pointerEvents: "none",
          display: "flex",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <Photos images={images} />
      </div>
    </div>
  );
};

export default App;
