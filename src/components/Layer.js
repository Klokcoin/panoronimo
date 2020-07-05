import React, { useEffect, useContext } from "react";
import { MapContext } from "./MapView";

const Layer = React.memo(
  ({ map, id, type, source, paint = {}, layout = {} }) => {
    useEffect(() => {
      let existing_layer = map.getLayer(id);
      console.log("updatey");
      // if (existing_layer) {
      //   map.removeLayer(id);
      // }
      if (!existing_layer) {
        map.addLayer({
          id,
          type,
          source,
          paint,
          layout,
        });
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, type, source, paint]);

    return null;
  }
);

const LayerWithMap = (props) => {
  const map = useContext(MapContext);

  return <Layer {...props} map={map} />;
};

export default LayerWithMap;
