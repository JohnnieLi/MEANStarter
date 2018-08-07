import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {NgMaterialModule} from './ngMaterial.module';
import {HomeComponent} from "./pages/home/home.component";
import {DetailComponent} from "./pages/detail/detail.component";

const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'detail/:id', component: DetailComponent},

];

@NgModule({
    imports: [CommonModule,
        NgMaterialModule,
        FormsModule,
        RouterModule.forRoot(routes),
        ],
    exports: [RouterModule],
    declarations: [HomeComponent, DetailComponent],
    providers: []
})
export class AppRoutingModule {
}