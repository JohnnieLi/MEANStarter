import {Component, OnInit, AfterViewInit} from '@angular/core';

declare var $: any;


@Component({
    selector: 'app-home-page',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit,AfterViewInit {

    title = 'home';



    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        $('.icon-test').fadeIn(1000);
        $('h1').hide();
    }
}
