import React, { useState, useEffect } from "react";
import { isEqual } from "lodash";

const Photos = React.memo(({ images }) => {
  const [imgs, setImgs] = useState([]);

  useEffect(() => {
    let didCancel = false;

    let fetchImages = async () => {
      const new_imgs = await Promise.all(
        images.map(
          (image) =>
            new Promise((resolve, reject) => {
              let img = new Image();
              img.src = image.url;
              img.onload = () => {
                resolve({
                  src: img.src,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                });
              };
            })
        )
      );

      if (!didCancel) {
        setImgs(new_imgs);
      }
    };

    fetchImages();

    return () => (didCancel = true);
  }, [images]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        // this limits the width of the entire bar
        maxWidth: "90vw",
      }}
    >
      {imgs.map(({ src, width, height }) => {
        let aspect_ratio = width / height;
        return (
          <div style={{ flex: aspect_ratio }} key={src}>
            <img
              src={src}
              alt="place"
              style={{
                width: "100%",
                height: "100%",
                // this is here such that in the case of few (<= 3) images, they don't take up the entire vh
                maxWidth: `calc(20vh*${aspect_ratio})`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
});

export default Photos;
