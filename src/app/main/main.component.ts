import { Component } from '@angular/core';
import { default as proj4 } from 'proj4';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, catchError, map } from 'rxjs';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule,HttpClientModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  input: string = '';
  options: string[] = [];
  googleMapsLink: string = '';

  constructor(private snackBar: MatSnackBar,private http:HttpClient) {

  }

  ngAfterViewInit() {
    //this.watchLocation();
    if ("geolocation" in navigator) {
      console.log('Geolocation API working');
    } else {
      this.snackBar.open('Browser does not support the Geolocation API!!', 'close', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    }

    
  }

  onItemClick(event: Event) {
    var element = event.target as HTMLInputElement;
    this.input = element.innerHTML;
  }

  async updateDropdown(event: Event) {
    var element = event.target as HTMLInputElement;

    // this.useOpenStreetMap(element.value);

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

  useOpenStreetMap(value:string){
    this.getAddressesStartingWith(value).subscribe(
      addresses => {
        this.options = addresses;
      },
      error => {
        console.error('Error:', error.message);
      }
    );
  }

  watchLocation() {
    const geoId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('watching: ');
        console.log(`${lat},${lng}  ${position.coords.accuracy}`);
        if (position.coords.accuracy > 10) {
          console.log("The GPS accuracy isn't good enough");
        }
      },
      (e) => {
        console.log("ERROR: " + e.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
    );
  }

  createGoogleMapsLink(event?: Event) {
    this.googleMapsLink = '';

    var adress;
    if (event == undefined || event == null) {
      adress = this.input;
    }
    else {
      var element = event.target as HTMLInputElement;
      adress = element.value
    }

    this.getCoordinates(adress).then((result) => {
      var location;
      if (!("geolocation" in navigator)) {
        location = 'standard location'
      }
      navigator.geolocation.getCurrentPosition((position) => {
        const currentLocation = position.coords.latitude + ',' + position.coords.longitude;

        this.googleMapsLink = `https://www.google.com/maps/dir/${currentLocation}/${result}`;
      }, null, {
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
  getAddressesStartingWith(prefix: string): Observable<string[]> {
    const url = `https://nominatim.openstreetmap.org/search.php?q=${encodeURIComponent(prefix)}&format=json&addressdetails=1`;
    return this.http.get<any[]>(url).pipe(
      map(data => {
        if (data && data.length > 0) {
          return data.map(item => item.display_name);
        } else {
          throw new Error('No addresses found starting with the given prefix');
        }
      }),
      catchError(error => {
        throw new Error('Failed to retrieve addresses from OpenStreetMap API: ' + error.message);
      })
    );
  }
}
