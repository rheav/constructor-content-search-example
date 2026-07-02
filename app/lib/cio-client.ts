import ConstructorIOClient from "@constructor-io/constructorio-client-javascript";

let cioClient: ConstructorIOClient | null = null;

export const CIO_API_KEY = "key_EKYrO0qcAxTeRwha";
export const CIO_SECTION = "Content";

export function getCioClient(): ConstructorIOClient | null {
  if (typeof window === "undefined") return null;

  if (!cioClient) {
    // sendTrackingEvents must be true for the client to actually dispatch
    // behavioral events (trackSearchResultsLoaded, trackConversion, etc.) to
    // Constructor. It defaults to false, which silently queues nothing.
    cioClient = new ConstructorIOClient({
      apiKey: CIO_API_KEY,
      sendTrackingEvents: true,
    });
  }

  return cioClient;
}
