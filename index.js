import {NativeModules, Image, Platform} from 'react-native';
import {createDefaultConfiguration, Configuration} from './configuration';

const {RNPhotoEditorSDK} = NativeModules;

function resolveStaticAsset(assetSource, extractURI = true) {
  const resolvedSource = Image.resolveAssetSource(assetSource);
  const source = (resolvedSource != null) ? resolvedSource : assetSource;
  if (extractURI) {
    return (source == null) ? null : ((source.uri != null) ? source.uri : source);
  }
  return source
}

function getNestedObject(nestedObject, pathArray) {
  return pathArray.reduce((obj, key) =>
      (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObject);
}

function resolveNestedAsset(nestedObject, pathArray) {
  let asset = getNestedObject(nestedObject, pathArray);
  // Resolve `asset` if it is a number (opaque type returned by require('./foo.png'))
  if (asset && typeof asset === 'number') {
    let key = pathArray.pop();
    let obj = getNestedObject(nestedObject, pathArray);
    obj[key] = resolveStaticAsset(asset);
  }
}

function resolveStaticAssets(configuration) {
  let filterCategories = getNestedObject(configuration, ["filter", "categories"]);
  if (filterCategories) {
    for (let category of filterCategories) {
      resolveNestedAsset(category, ["thumbnailURI"]);
      let filters = getNestedObject(category, ["items"]);
      if (filters) {
        for (let filter of filters) {
          resolveNestedAsset(filter, ["lutURI"]);
        }
      }
    }
  }
  let stickerCategories = getNestedObject(configuration, ["sticker", "categories"]);
  if (stickerCategories) {
    for (let category of stickerCategories) {
      resolveNestedAsset(category, ["thumbnailURI"]);
      let stickers = getNestedObject(category, ["items"]);
      if (stickers) {
        for (let sticker of stickers) {
          resolveNestedAsset(sticker, ["thumbnailURI"]);
          resolveNestedAsset(sticker, ["stickerURI"]);
        }
      }
    }
  }
  let fonts = getNestedObject(configuration, ["text", "fonts"]);
  if (fonts) {
    for (let font of fonts) {
      resolveNestedAsset(font, ["fontURI"]);
    }
  }
  let overlays = getNestedObject(configuration, ["overlay", "items"]);
  if (overlays) {
    for (let overlay of overlays) {
      resolveNestedAsset(overlay, ["thumbnailURI"]);
      resolveNestedAsset(overlay, ["overlayURI"]);
    }
  }
  let frames = getNestedObject(configuration, ["frame", "items"]);
  if (frames) {
    for (let frame of frames) {
      resolveNestedAsset(frame, ["thumbnailURI"]);
      resolveNestedAsset(frame, ["imageGroups", "top", "startURI"]);
      resolveNestedAsset(frame, ["imageGroups", "top", "midURI"]);
      resolveNestedAsset(frame, ["imageGroups", "top", "endURI"]);
      resolveNestedAsset(frame, ["imageGroups", "left", "startURI"]);
      resolveNestedAsset(frame, ["imageGroups", "left", "midURI"]);
      resolveNestedAsset(frame, ["imageGroups", "left", "endURI"]);
      resolveNestedAsset(frame, ["imageGroups", "right", "startURI"]);
      resolveNestedAsset(frame, ["imageGroups", "right", "midURI"]);
      resolveNestedAsset(frame, ["imageGroups", "right", "endURI"]);
      resolveNestedAsset(frame, ["imageGroups", "bottom", "startURI"]);
      resolveNestedAsset(frame, ["imageGroups", "bottom", "midURI"]);
      resolveNestedAsset(frame, ["imageGroups", "bottom", "endURI"]);
    }
  }
}

class PESDK {
  /**
   * Modally present a photo editor.
   * @note EXIF meta data is only preserved in the edited image if and only if the source
   * image is loaded from a local `file://` resource.
   *
   * @param {string | {uri: string} | number} imageSource The source of the image to be edited.
   * Can be either an URI (local, remote, data resource, or any other registered scheme for the
   * React Native image loader), an object with a member `uri`, or an asset reference which can
   * be optained by, e.g., `require('./image.png')` as `number`.
   * @param {Configuration} configuration The configuration used to initialize the editor.
   * @param {object} serialization The serialization used to initialize the editor. This
   * restores a previous state of the editor by re-applying all modifications to the loaded
   * image.
   *
   * @return {Promise<{image: string, hasChanges: boolean, serialization: object}>} Returns the
   * edited `image`, an indicator (`hasChanges`) whether the input image was modified at all, and
   * all modifications (`serialization`) applied to the input image if `export.serialization.enabled`
   * of the `configuration` was set. If the editor is dismissed without exporting the edited image
   * `null` is returned instead.
   */
  static openEditor(imageSource, configuration = null, serialization = null) {
    resolveStaticAssets(configuration)
    const image = resolveStaticAsset(imageSource, Platform.OS == 'android');
    if (Platform.OS == 'android') {
      return RNPhotoEditorSDK.present(image, configuration, serialization != null ? JSON.stringify(serialization) : null);
    } else {
      return RNPhotoEditorSDK.present(image, configuration, serialization);
    }
  }

  /**
   * Unlock PhotoEditor SDK with a license.
   *
   * @param {string | object} license The license used to unlock the SDK. Can be either an URI
   * pointing to a local `file://` resource that contains the license, the license as a string,
   * or the license as an object which can be optained by, e.g., `require('./pesdk_license')`
   * where the required license files must be named `./pesdk_license.ios.json` for the iOS license
   * and `./pesdk_license.android.json` for the Android license file in order to get automatically
   * resolved by the packager.
   */
  static unlockWithLicense(license) {
    if (Platform.OS == 'android') {
      RNPhotoEditorSDK.unlockWithLicense(JSON.stringify(license));
    } else {
      RNPhotoEditorSDK.unlockWithLicense(license);
    }
  }

  /**
   * Creates a configuration object populated with default values for all options.
   * @return {Configuration} The default configuration.
   */
  static createDefaultConfiguration() {
    return createDefaultConfiguration()
  }
}

export {PESDK};
export * from './configuration';
