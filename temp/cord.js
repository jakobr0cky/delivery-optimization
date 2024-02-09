import { proj4 } from './node_modules/proj4';

const adresse = "Hardeggase 67/47";
const apiUrl = "https://www.wien.gv.at/viennagis/wiengis.xml";

async function getCoordinates(address) {
    try {
        const req = `https://data.wien.gv.at/daten/OGDAddressService.svc/GetAddressInfo?Address=${address}`;
        console.log(req);
        const response = await fetch(req);
        const responseData = await response.json();
        console.log(responseData.features[0].geometry.coordinates);

        proj4.defs("EPSG:31256", "+proj=tmerc +lat_0=0 +lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs");
        proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

        const coordinates4326 = proj4("EPSG:31256", "EPSG:4326", responseData.features[0].geometry.coordinates);
        // console.log(coordinates4326[1] + ',' + coordinates4326[0]);

        return coordinates4326[1] + ',' + coordinates4326[0];
    } catch (error) {
        console.log('error'+error);
    }

}