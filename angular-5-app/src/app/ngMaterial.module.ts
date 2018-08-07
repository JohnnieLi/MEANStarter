import {NgModule} from '@angular/core';
import {
    MatButtonModule, MatInputModule, MatCheckboxModule, MatFormFieldModule, MatSelectModule, MatSlideToggleModule,
    MatTabsModule, MatExpansionModule, MatDatepickerModule, MatNativeDateModule
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatExpansionModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    exports: [
        MatButtonModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatExpansionModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
})

export class NgMaterialModule {

}