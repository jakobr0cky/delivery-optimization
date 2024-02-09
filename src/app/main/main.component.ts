import { Component } from '@angular/core';
import { default as proj4 } from 'proj4';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  input: string = '';
  options: string[] = [];
  googleMapsLink: string = '';

  onItemClick(event: Event) {
    var element = event.target as HTMLInputElement;
    this.input = element.innerHTML;
  }

  async updateDropdown(event: Event) {
    var element = event.target as HTMLInputElement;

    var response = await fetch(`https://data.wien.gv.at/daten/OGDAddressService.svc/GetAddressInfo?Address=${element.value}&limit=10`);

    if (!response || !response.ok) {
      console.error('Failed to fetch data');
      return;
    }

    try {
      const responseData = await response.json();
      const temp = [];

      for (let i = 0; i < Math.min(responseData.features.length, 50); i++) {
        temp.push(responseData.features[i].properties.Adresse);
      }

      this.options = temp;
    } catch (error) {
      console.error('Error processing response:', error);
    }
  }

  createGoogleMapsLink(event: Event) {
    var element = event.target as HTMLInputElement;

    this.getCoordinates(element.value).then((result) => {
      var location;
      if (!("geolocation" in navigator)) {
        location = 'standard location'
      }
      navigator.geolocation.getCurrentPosition((position) => {
        const currentLocation = position.coords.latitude + ',' + position.coords.longitude;

        this.googleMapsLink = `https://www.google.com/maps/dir/${currentLocation}/${result}`;
      },null,{ 
        enableHighAccuracy: true, // Use high-accuracy methods if available
        timeout: 10000, // Timeout in milliseconds
        maximumAge: 0 // Force a fresh location even if cached
    });
    });
  }

  async getCoordinates(address: string) {
    try {
      const response = await fetch(`https://data.wien.gv.at/daten/OGDAddressService.svc/GetAddressInfo?Address=${address}`);
      const responseData = await response.json();

      proj4.defs("EPSG:31256", "+proj=tmerc +lat_0=0 +lon_0=16.33333333333333 +k=1 +x_0=0 +y_0=-5000000 +ellps=bessel +towgs84=577.326,90.129,463.919,5.137,1.474,5.297,2.4232 +units=m +no_defs");
      proj4.defs("EPSG:4326", "+proj=longlat +datum=WGS84 +no_defs");

      const coordinates4326 = proj4("EPSG:31256", "EPSG:4326", responseData.features[0].geometry.coordinates);

      return coordinates4326[1] + ',' + coordinates4326[0];
    } catch (error) {
      console.log('error: ' + error);
      return;
    }
  }
}
