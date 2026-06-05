
// utils/getLocation.ts
export const getUserLocation = () => {

  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        // console.log(error,'===============login code inside error==============');
        
        // reject(error.message);

        if (err.code === 1) {
          // PERMISSION_DENIED
             reject(err.message);
          }

          if (err.code === 2) {
            // POSITION_UNAVAILABLE
            console.warn("GPS unavailable, using fallback with error code ",err.code);
             reject(err.message);
          }

          if (err.code === 3) {
            // TIMEOUT
            console.warn("Location timeout, retrying or fallback  with error code",err.code);
              reject(err.message);
          }
      },
      {
        // enableHighAccuracy: true,
        enableHighAccuracy: true, // ⭐ KEY FIX
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

export const checkLocationPermission = async () => {
  if (!navigator.permissions) return "unsupported";

  const result = await navigator.permissions.query({
    name: "geolocation",
  });

  return result.state; // granted | prompt | denied
};
