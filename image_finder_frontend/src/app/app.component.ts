// app.component.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GalleryComponent, GalleryImageComponent, GalleryItem, GalleryRef, ImageItem } from 'ng-gallery';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  query: string = '';
  size: any = 1;

  images: string[] = [];
  imagesGallery: GalleryItem[] = [];

  @ViewChild('gallery', { static: true }) gallery: GalleryRef | undefined;

  headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST'
  });

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    this.imagesGallery.push(new ImageItem({ src: 'https://picsum.photos/500/500?random=1', thumb: 'https://picsum.photos/500/500?random=1' }));
    this.imagesGallery.push(new ImageItem({ src: 'https://picsum.photos/500/500?random=2', thumb: 'https://picsum.photos/500/500?random=2' }));


  }

  ngOnInit(): void {
    console.log(this.gallery);
  }

  ngAfterViewInit(): void {
    console.log(this.gallery);
  }

  submitSearch() {
    // Perform the logic for submitting the search (e.g., making a POST request to a REST service)
    console.log('Search query submitted:', this.query);

    this.http.post('http://localhost:5000/image-finder-rest/search',
      { query: this.query, size: this.size }, { responseType: 'json', headers: this.headers })
      .subscribe((response: any) => {
        if (response && response['response'] === 'success') {
          console.log('Response:', response);

          for (let img of response['images']) {
            //this.imagesGallery.push(new ImageItem({ src: img, thumb: img }));
            this.gallery?.add(new ImageItem({ src: img, thumb: img }), true);
          }

          this.cdr.detectChanges();
          this.images = response['images'];
        }
      });
  }
}
