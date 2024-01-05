// app.component.ts

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Gallery, GalleryConfig, GalleryImageComponent, GalleryItem, GalleryRef, ImageItem } from 'ng-gallery';

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

  currIndex: number = 0;

  found: number = 0;

  @ViewChild('gallery', { static: true }) gallery: GalleryRef | undefined;

  headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST'
  });

  inputText: string = '';
  outputList: string[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private gal: Gallery) {
  }

  ngOnInit(): void {
    this.inputText = "['https://img.gta5-mods.com/q95/images/sahsa-borderlands-add-on-ped-replace/40e24e-screen_001.jpg', 'https://pbs.twimg.com/media/CaETL-LXEAANC9U.jpg']";
    //this.inputText = "['https://img.gta5-mods.com/q95/images/sahsa-borderlands-add-on-ped-replace/40e24e-screen_001.jpg', 'https://pbs.twimg.com/media/CaETL-LXEAANC9U.jpg', 'https://cdn11.bigcommerce.com/s-xhmrmcecz5/images/stencil/1280x1280/products/17843/19035/Sasha-Tales-from-the-Borderlands-Silk-Poster-Print-Wall-Decor-20-x-13-Inch-24-x-36-Inch__02126.1604458776.jpg', 'https://www.gameshub.com/wp-content/uploads/sites/5/2022/04/tales-from-the-borderlands.jpeg', 'https://pm1.aminoapps.com/6012/d56a5b3d273b11472944add14cb85f73945f69d8_hq.jpg', 'https://live.staticflickr.com/1553/24905624184_de9eb7fbe5_h.jpg', 'https://i.redd.it/toj5hztoutu51.jpg', 'https://i.pinimg.com/originals/33/c4/7e/33c47ea4c0f965375fa203a2ad857e41.jpg', 'https://i.redd.it/gn1nwjyv10u41.png', 'https://i.ytimg.com/vi/-oUXNv85mmw/maxresdefault.jpg', 'https://static0.gamerantimages.com/wordpress/wp-content/uploads/2022/08/new-tales-from-the-borderlands-fiona-sasha.jpg', 'https://mentalmars.com/wp-content/uploads/2022/08/New-Tales-From-The-Borderlands-Fiona-Sasha.jpg', 'https://i.imgur.com/HjEKafy.jpg', 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ad5f806f-6ca1-4fdc-8699-86663ad31782/d8a4sss-7881d87b-f5f2-456b-8c4a-bd4ccf1699d9.png/v1/fill/w_1032,h_774,q_70,strp/sasha___tales_from_the_borderlands_by_infernokun_d8a4sss-pre.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MzAwMCIsInBhdGgiOiJcL2ZcL2FkNWY4MDZmLTZjYTEtNGZkYy04Njk5LTg2NjYzYWQzMTc4MlwvZDhhNHNzcy03ODgxZDg3Yi1mNWYyLTQ1NmItOGM0YS1iZDRjY2YxNjk5ZDkucG5nIiwid2lkdGgiOiI8PTQwMDAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.Z_yqZ5_HPMaGKXxE11Bx88X8ETTdTXqIIy_BZphVEio', 'https://static0.gamerantimages.com/wordpress/wp-content/uploads/2021/03/Sasha-Cover.jpg', 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/ad5f806f-6ca1-4fdc-8699-86663ad31782/d8z7y4a-8e1867cb-cee2-42c1-82a4-c70734e2c843.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2FkNWY4MDZmLTZjYTEtNGZkYy04Njk5LTg2NjYzYWQzMTc4MlwvZDh6N3k0YS04ZTE4NjdjYi1jZWUyLTQyYzEtODJhNC1jNzA3MzRlMmM4NDMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.-21tj8xrO-vbiCbHApSZzZU3DM-LiZRIuHv6_hQgEQw', 'https://cdn.akamai.steamstatic.com/steam/apps/330830/ss_57a25061e73bb96e991614b440dad13661f3735d.1920x1080.jpg', 'https://pbs.twimg.com/media/CDO-APAUEAEgzeg.jpg', 'https://i.pinimg.com/originals/41/83/cc/4183cc0b8f06b15427eb872ca5debd92.jpg', 'https://64.media.tumblr.com/7de285bfeae2c3c2baca47e196fe8455/tumblr_ppd6qvfDTF1vaqhnlo1_1280.png', 'https://static.wikia.nocookie.net/vsbattles/images/e/e1/Sasha_%28TFTB%29.png', 'https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/cdn/6f979d15-1479-4b6f-a36e-6cf4e800b3e8/300abf71-d3e0-4e12-8174-2c799604f73e.jpg', 'https://pbs.twimg.com/media/CWTUsOdW4AAuj_7.png', 'https://www.destructoid.com/wp-content/uploads/2020/12/316225-2015-10-18_00067.jpg', 'https://d1lss44hh2trtw.cloudfront.net/assets/editorial/2014/11/tales_sasha.jpg', 'https://dashgamer.com/wp-content/uploads/2016/02/453379-tales-from-the-borderlands-1155x770.jpg', 'https://static1.thegamerimages.com/wordpress/wp-content/uploads/2020/10/Borderlands-Missed-Characters-Feature.jpg', 'https://64.media.tumblr.com/a6c73f37e870978924b5050fcce2196e/054ad48f21360964-be/s1280x1920/a12cb3ffa6ad86ac72cca6125c2ffe2bb5f0c593.png', 'https://i.ytimg.com/vi/O9dVr8OVras/maxresdefault.jpg', 'https://m.media-amazon.com/images/M/MV5BZWMzNGU2OTItYzEyMC00YzAxLThhMjgtOTFjYTk5N2FhNjc3XkEyXkFqcGdeQXVyODg1MTc3MTM@._V1_.jpg', 'https://cdnb.artstation.com/p/assets/images/images/006/515/329/large/gfactory-studio-hsasha.jpg', 'https://static.wikia.nocookie.net/borderlands/images/9/98/Sasha_Intro.png', 'https://cosplayfu-website.s3.amazonaws.com/_Upload/b/46747-Sasha-Plush-Toy-from-Tales-from-the-Borderlands.jpg', 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/353aa6c7-675d-4d36-917d-b1f3df7178ed/dazvkhe-165e9c6d-b5df-4ed0-b915-71f2c864e85b.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcLzM1M2FhNmM3LTY3NWQtNGQzNi05MTdkLWIxZjNkZjcxNzhlZFwvZGF6dmtoZS0xNjVlOWM2ZC1iNWRmLTRlZDAtYjkxNS03MWYyYzg2NGU4NWIuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.D0Z3BoPfagLi3sxvXv7HovqlHh3OK1TI1dXA_OMOJB4', 'https://i.imgur.com/vdbDLxX.jpg', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/tales-from-borderlands/4/41/Trust.png', 'https://i.ytimg.com/vi/YiveJ2mXhSk/maxresdefault.jpg', 'https://mentalmars.com/wp-content/uploads/2023/08/Tales-From-The-Borderlands-2.jpg', 'https://cdn.mos.cms.futurecdn.net/320325b87911c3230f7eee0f9e4ca24b-1200-80.png', 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/8fde87e7-9e99-430f-b8cd-b1255d5ac4b2/ddwfrwt-63bfab04-773c-4e9d-bf3b-c2f80d42403e.png/v1/fill/w_1280,h_2666/tales_from_the_borderlands__sasha__by_kabalstein_ddwfrwt-fullview.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MjY2NiIsInBhdGgiOiJcL2ZcLzhmZGU4N2U3LTllOTktNDMwZi1iOGNkLWIxMjU1ZDVhYzRiMlwvZGR3ZnJ3dC02M2JmYWIwNC03NzNjLTRlOWQtYmYzYi1jMmY4MGQ0MjQwM2UucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.7zXJ88JIRw2rEuSqVtCJdeBqMh4WJ3m9tm091hyyuQI', 'https://ew.com/thmb/65T4XdY6NWpW5UfQVb7c8QpMWEg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/boost201920x1080-cf88a94908ed46f5ae7b5328add6e5c1.jpg', 'https://preview.redd.it/uy4xwqx9sdn31.png?auto=webp&s=5720eabcec257e9a227b22a13ceaa8b5dcddf59a', 'https://assets1.ignimgs.com/thumbs/userUploaded/2015/10/24/tftbthumbnailp2-1445701309498.png', 'https://static0.gamerantimages.com/wordpress/wp-content/uploads/2023/08/borderlands-fiona-sasha-plan.jpg', 'https://i0.wp.com/i.imgur.com/yEpjIcu.jpg', 'https://static1.thegamerimages.com/wordpress/wp-content/uploads/2023/03/lingering-questions-we-have-after-the-end-of-new-tales-from-the-borderlands-feature-pic.jpg', 'https://oyster.ignimgs.com/mediawiki/apis.ign.com/tales-from-borderlands/0/04/Sasha.png', 'https://i.ytimg.com/vi/XRCbWdovBfo/maxresdefault.jpg']"
  }

  ngAfterViewInit(): void {
    this.convertToList();
  }

  submitSearch() {
    // Perform the logic for submitting the search (e.g., making a POST request to a REST service)
    console.log('Search query submitted:', this.query);

    this.http.post('http://localhost:5000/image-finder-rest/search',
      { query: this.query, size: this.size }, { responseType: 'json', headers: this.headers })
      .subscribe((response: any) => {
        if (response && response['response'] === 'success') {
          console.log('Response:', response);

          this.gallery?.remove(1);
          this.gallery?.remove(0);

          response['images'].forEach((img: string, index: number) => {
            this.gallery?.add(new ImageItem({ src: img, thumb: img }), index == 0 ? true : false);
            this.images.push(img);
          });

          this.found = response['images'].length;

          this.cdr.detectChanges();
          this.images = response['images'];
        }
      });
  }

  trackIndex(event: any) {
    this.currIndex = event.currIndex;
    console.log('Current index:', this.currIndex);
  }

  downloadCurrentImage(downloadAll: boolean = false) {
    if (downloadAll) {
      this.http.post('http://localhost:5000/image-finder-rest/download', { links: this.images }, { responseType: 'json', headers: this.headers }).subscribe((response: any) => {
        console.log('Response:', response);
      });

    } else {
      const theLink = this.images[this.currIndex];
      console.log('Downloading image:', theLink);

      this.http.post('http://localhost:5000/image-finder-rest/download', { links: [theLink] }, { responseType: 'json', headers: this.headers }).subscribe((response: any) => {
        console.log('Response:', response);
      });
    }
  }


  downloadAllImages() {
  }

  convertToList() {

    let text = this.inputText as string;
    const correctedStr: string = text.replace(/'/g, '"');
    const imported = JSON.parse(correctedStr);

    imported.forEach((img: string, index: number) => {
      this.gallery?.add(new ImageItem({ src: img, thumb: img }), index == 0 ? true : false);
      this.images.push(img);
    });

    this.gallery?.set(0);

  }
}
