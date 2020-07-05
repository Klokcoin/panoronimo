import React, { useEffect, useState, useRef, createContext } from "react";
import mapbox from "mapbox-gl";
import { isEqual, transform, isObject } from "lodash";
import { mapbox_api_key } from "../api_keys";

mapbox.accessToken = mapbox_api_key;

function difference(object, base) {
  function changes(object, base) {
    return transform(object, function (result, value, key) {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value;
      }
    });
  }
  return changes(object, base);
}

export const MapContext = createContext(null);

class MapProvider extends React.Component {
  // state = {
  //   map: this.props.value,
  // };

  // static getDerivedStateFromProps(props, state) {

  // }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.value && this.props.value) {
      console.log(difference(nextProps.value, this.props.value));
    }
    return true;
  }

  render() {
    return (
      <MapContext.Provider value={this.props.value}>
        {this.props.children}
      </MapContext.Provider>
    );
  }
}

const map_events = new Map(
  [
    ["resize", "resize"],
    ["remove", "remove"],
    ["mousedown", "mouseDown"],
    ["mouseup", "mouseUp"],
    ["mouseover", "mouseOver"],
    ["mousemove", "mouseMove"],
    ["click", "click"],
    ["dblclick", "doubleClick"],
    ["mouseenter", "mouseEnter"],
    ["mouseleave", "mouseLeave"],
    ["mouseout", "mouseOut"],
    ["contextmenu", "contextMenu"],
    ["wheel", "wheel"],
    ["touchstart", "touchStart"],
    ["touchend", "touchEnd"],
    ["touchmove", "touchMove"],
    ["touchcancel", "touchCancel"],
    ["movestart", "moveStart"],
    ["move", "move"],
    ["moveend", "moveEnd"],
    ["dragstart", "dragStart"],
    ["drag", "drag"],
    ["dragend", "dragEnd"],
    ["zoomstart", "zoomStart"],
    ["zoom", "zoom"],
    ["zoomend", "zoomEnd"],
    ["rotatestart", "rotateStart"],
    ["rotate", "rotate"],
    ["rotateend", "rotateEnd"],
    ["pitchstart", "pitchStart"],
    ["pitch", "pitch"],
    ["pitchend", "pitchEnd"],
    ["boxzoomstart", "boxZoomStart"],
    ["boxzoomend", "boxZoomEnd"],
    ["boxzoomcancel", "boxZoomCancel"],
    ["load", "load"],
    ["render", "render"],
    ["idle", "idle"],
    ["error", "error"],
    ["data", "data"],
    ["styledata", "styleData"],
    ["sourcedata", "sourceData"],
    ["dataloading", "dataLoading"],
    ["styledataloading", "styleDataLoading"],
    ["sourcedataloading", "sourceDataLoading"],
  ].map(([key, [firstLetter, ...rest]]) => [
    key,
    "on" + firstLetter.toUpperCase() + rest.join(""),
  ])
);

const default_options = {
  center: {
    lat: 64,
    lng: 10,
  },
  bounds: [
    [-69.8046875000467, -14.721874718264118],
    [96.660156249951, 71.98234984606913],
  ],
  zoom: 3,
};

const MapView = ({ children, style, className, ...props }) => {
  const [map, setMap] = useState(undefined);
  const [ready, setReady] = useState(false);
  const oldHandlers = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const _map = new mapbox.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: default_options.center,
      zoom: default_options.zoom,
      bounds: default_options.bounds,
    });

    _map.once("load", (event) => {
      setReady(true);
    });

    setMap(_map);
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    let provided_handlers = Array.from(map_events).filter(
      ([event_name, handler_name]) =>
        props[handler_name] && typeof props[handler_name] === "function"
    );

    if (isEqual(oldHandlers.current, provided_handlers)) {
      return;
    }

    oldHandlers.current = provided_handlers;

    let listeners = provided_handlers.map(([event_name, handler_name]) => {
      let listener = (event) => {
        if (event) {
          props[handler_name](map, event);
        } else {
          props[handler_name](event);
        }
      };
      return { event_name, listener };
    });

    listeners.forEach(({ event_name, listener }) =>
      map.on(event_name, listener)
    );

    return () => {
      if (isEqual(oldHandlers.current, provided_handlers)) {
        return;
      }

      listeners.forEach(({ event_name, listener }) =>
        map.off(event_name, listener)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props]);

  return (
    <MapProvider value={map}>
      <div
        ref={containerRef}
        style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }}
      >
        {ready && children}
      </div>
    </MapProvider>
  );
};

export default MapView;
