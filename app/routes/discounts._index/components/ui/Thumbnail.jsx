// @ts-nocheck
import React from 'react';

const Thumbnail = ({ source, alt }) => (
  <img
    src={source}
    alt={alt}
    className="w-8 h-8 rounded-md object-cover border border-gray-200"
  />
);

export default Thumbnail;