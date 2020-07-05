import { ApolloServer, gql } from "apollo-server";
import { stringify } from "querystring";
import fetch from "node-fetch";
import { uniqBy } from "lodash";
import { flickr_api_key, mapillary_api_key } from "./api_keys";

const promisify_readable_stream = (stream) => {
  return new Promise((resolve, reject) => {
    let body = "";

    stream.on("data", (chunk) => {
      body += chunk;
    });

    stream.on("error", (error) => {
      reject(error);
    });

    stream.on("end", () => {
      resolve(body);
    });
  });
};

const fetch_flickr_images = async ({ center, radius, amount = 3 }) => {
  const endpoint = "https://www.flickr.com/services/rest/?";

  const sizes = {
    original: "o", // ???
    xxlarge: "k", // 2048, 2048
    xlarge: "h", // 1600, 1600
    large: "b", // 1024 on longest side
    xmedium: "c", // 800, 800 on longest side†
    medium: "z", // 640, 640 on longest side
    small: "n", // 320 on longest side
  };

  let url =
    endpoint +
    stringify({
      format: "json",
      nojsoncallback: true, // see https://www.flickr.com/services/api/response.json.html
      method: "flickr.photos.search", // see https://www.flickr.com/services/api/flickr.photos.search.html
      api_key: flickr_api_key,
      content_type: 1, // only photos
      has_geo: true,
      accuracy: 13,
      geo_context: 2, // 0: not defined, 1: indoors, 2: outdoors
      lat: center.lat,
      lon: center.lng, // watch it for some reason they deviate from the standard 'lng' and abbreviate it as 'lon' 😒
      radius: Math.min(32, radius),
      radius_units: "km",
      page: 1,
      per_page: 25,
    });

  let response = await fetch(url);
  let body = await promisify_readable_stream(response.body);
  let json = JSON.parse(body);
  const {
    photos: { photo: flickr_photos },
  } = json;

  let images = await Promise.all(
    uniqBy(flickr_photos, (photo) => {
      return photo.owner;
    })
      .map(async ({ farm, server, id, secret }) => {
        let url = `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}_${sizes.small}.jpg`;

        let response = await fetch(
          endpoint +
            stringify({
              format: "json",
              nojsoncallback: true,
              method: "flickr.photos.getInfo",
              api_key: flickr_api_key,
              photo_id: id,
              secret: secret,
            })
        );
        let body = await promisify_readable_stream(response.body);
        let json = JSON.parse(body);

        return {
          url,
          location: {
            lng: json.photo.location.longitude,
            lat: json.photo.location.latitude,
          },
        };
      })
      .slice(0, amount)
  );

  return images;
};

const fetch_mapillary_images = async ({ center, radius, amount = 3 }) => {
  const endpoint = "https://a.mapillary.com/v3/images?";

  let url = // see https://www.mapillary.com/developer/api-documentation/#search-images
    endpoint +
    stringify({
      client_id: mapillary_api_key,
      closeto: `${center.lng},${center.lat}`,
      per_page: 25,
      radius: radius * 1000,
      private: false,
    });
  let response = await fetch(url);
  let body = await promisify_readable_stream(response.body);
  let json = JSON.parse(body);
  const { features: mapillary_photos } = json;

  let images = uniqBy(mapillary_photos, ({ properties, ...rest }) => {
    return properties.user_key;
  })
    .map(({ properties: { key }, geometry: { coordinates } }) => {
      let url = `https://images.mapillary.com/${key}/thumb-320.jpg`; // 320, 640, 1024 or 2048
      return {
        url,
        location: {
          lng: coordinates[0],
          lat: coordinates[1],
        },
      };
    })
    .slice(0, amount);

  return images;
};

const typeDefs = gql`
  type Query {
    images(center: InputLatLng!, radius: Float!): [Image]
  }

  input InputLatLng {
    lat: Float!
    lng: Float!
  }

  type LatLng {
    lat: Float!
    lng: Float!
  }

  type Image {
    url: String!
    location: LatLng
  }
`;

const resolvers = {
  Query: {
    images: async (_root, { center, radius }) => {
      try {
        console.log("radius", radius);
        let flickr_images = await fetch_flickr_images({
          center,
          radius,
          amount: 3,
        });
        let mapillary_images = await fetch_mapillary_images({
          center,
          radius,
          amount: 3,
        });

        return [...flickr_images, ...mapillary_images];
      } catch (e) {
        console.error(e);
      }
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
