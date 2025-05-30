import {Location} from "./generated/graphql";
import * as geofire from "geofire-common";
import {Client, GeocodeRequest, GeocodeResponseData} from "@googlemaps/google-maps-services-js";
import { googleMapsApiKey } from "./platform";

// Interface for external map API services
export interface IExternalMapAPI {
  geocode(address: string): Promise<GeocodeResponseData>;
}

// Google Maps implementation for the external API
export class GoogleMapsAPI implements IExternalMapAPI {
  private client: Client;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      console.warn("Google Maps API key is required for GoogleMapsAPI service.");
    }
    this.apiKey = apiKey;
    this.client = new Client({});
  }

  async geocode(address: string): Promise<GeocodeResponseData> {
    const request: GeocodeRequest = {
      params: {
        address: address,
        key: this.apiKey,
      },
    };
    try {
      const response = await this.client.geocode(request);
      if (!response.data.results || response.data.results.length === 0) {
        console.warn(`Geocoding for address "${address}" returned no results.`);
      }
      return response.data;
    } catch (error) {
      console.error(`Error during geocoding for address "${address}":`, error);
      throw error;
    }
  }
}


export class MapService {
  private externalApi: IExternalMapAPI;
  
  constructor(externalApi: IExternalMapAPI) {
    this.externalApi = externalApi;
  }

  async resolveLocationAndGeohash(address: string): Promise<Location | null> {
    try {
      const geocodeResult = await this.externalApi.geocode(address);

      if (!this.isValidGeocodeResult(geocodeResult)) {
        console.warn(`Could not resolve address "${address}" to a valid location (no results in response).`);
        throw new Error(`Could not resolve address "${address}" to a valid location (no results in response).`);
      }

      return this.createLocationFromGeocodeResult(geocodeResult);
    } catch (error) {
      console.error(`Geocoding failed for address "${address}" in resolveLocationAndGeohash.`);
      throw error;
    }
  }

  /**
   * Checks if geocode result contains valid location data
   */
  private isValidGeocodeResult(result: GeocodeResponseData): boolean {
    return Boolean(
        result.results &&
        result.results.length > 0 &&
        result.results[0].geometry &&
        result.results[0].geometry.location
    );
  }

  /**
   * Creates a location object from valid geocode result
   */
  private createLocationFromGeocodeResult(result: GeocodeResponseData): Location {
    const location = result.results[0].geometry.location;
    const coordinates: [number, number] = [location.lat, location.lng];
    const geohash = geofire.geohashForLocation(coordinates);

    return {
      latitude: location.lat,
      longitude: location.lng,
      geohash: geohash,
    };
  }

  async getLocationsByRadius(
    query: FirebaseFirestore.Query,
    geolocation: Location,
    radiusKm: number
  ): Promise<FirebaseFirestore.DocumentData[]> {
    let center: geofire.Geopoint = [
      geolocation.latitude,
      geolocation.longitude,
    ];
    const radiusInM = radiusKm * 1000;
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    const promises = bounds.map((b) => {
      const q = query.orderBy("geohash").startAt(b[0]).endAt(b[1]);
      return q.get();
    });
    const snapshots = await Promise.all(promises);
    const documentDatas: FirebaseFirestore.DocumentData[] = [];
    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        const location = doc.get("location") as Location;
        const distanceInKm = geofire.distanceBetween(
          [location.latitude, location.longitude],
          center
        );
        const distanceInM = distanceInKm * 1000;
        if (distanceInM <= radiusInM) {
          const data = doc.data();
          documentDatas.push({ id: doc.id, ...data });
        }
      });
    });
    return documentDatas;
  }
}

// Factory function to create MapService with Google Maps
export const createMapService = (): MapService => {
   const apiKey = googleMapsApiKey;

  if (!apiKey) {
    console.warn("CRITICAL: googleMapsApiKey not found in platform.ts. MapService geocoding will fail.");
  }
  const googleMapsApi = new GoogleMapsAPI(apiKey);
  return new MapService(googleMapsApi);
};
