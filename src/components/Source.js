import React, { useEffect, useContext } from "react";
import { MapContext } from "./MapView";

const Source = React.memo(({ map, id, type, data }) => {
  useEffect(() => {
    let existing_source = map.getSource(id);
    if (!existing_source) {
      map.addSource(id, {
        type,
        data,
      });
    } else {
      existing_source.setData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, type, data]);

  return null;
});

const WrappedSource = (props) => {
  const map = useContext(MapContext);

  return <Source {...props} map={map} />;
};

export default WrappedSource;
