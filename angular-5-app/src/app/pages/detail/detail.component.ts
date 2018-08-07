import {Component, OnInit} from '@angular/core';



@Component({
    selector: 'app-detail-page',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

    title = 'home';


    ngOnInit(): void {
    }
}