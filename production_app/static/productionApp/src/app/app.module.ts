import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Insomnia } from '@ionic-native/insomnia';
import { HttpModule } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { Network } from '@ionic-native/network';
import { File } from '@ionic-native/file';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es';
registerLocaleData(es);

//Paginas
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ProductionPage } from '../pages/production/production';
import { ListPage } from '../pages/list/list';
import { ListProductionsPage } from '../pages/list-productions/list-productions';
import { ChecksModalPage } from '../pages/checks-modal/checks-modal';
import { ConsumeModalPage } from '../pages/consume-modal/consume-modal';
import { UsersModalPage } from '../pages/users-modal/users-modal';
import { ReasonsModalPage } from '../pages/reasons-modal/reasons-modal';
import { FinishModalPage } from '../pages/finish-modal/finish-modal';
import { ScrapModalPage } from '../pages/scrap-modal/scrap-modal';
import { NoteModalPage } from '../pages/note-modal/note-modal';
import { ListProductionsModalPage } from '../pages/list-productions-modal/list-productions-modal';
import { ConsumptionsPage } from '../pages/consumptions/consumptions';
import { ConsumptionListModalPage } from '../pages/consumption-list-modal/consumption-list-modal';
import { AlimentatorConsumptionsPage } from '../pages/alimentator-consumptions/alimentator-consumptions';
import { CalculatorModalPage } from '../pages/calculator/calculator';
import { StockInfoPage } from '../pages/stock-info/stock-info';

//Providers
import { OdooProvider } from '../providers/odoo/odoo';
import { ProductionProvider } from '../providers/production/production';

//Componentes
import { TimerComponent } from '../components/timer/timer';



@NgModule({
    declarations: [
        MyApp,
        HomePage,
        ProductionPage,
        ListPage,
        ListProductionsPage,
        ChecksModalPage,
        UsersModalPage,
        ReasonsModalPage,
        FinishModalPage,
        ScrapModalPage,
        NoteModalPage,
        ListProductionsModalPage,
        ConsumeModalPage,
        ConsumptionListModalPage,
        ConsumptionsPage,
        AlimentatorConsumptionsPage,
        TimerComponent,
        CalculatorModalPage,
        StockInfoPage
    ],
    imports: [
        BrowserModule,
        HttpModule,
        IonicModule.forRoot(MyApp),
        IonicStorageModule.forRoot()
    ],
    bootstrap: [IonicApp],

    entryComponents: [
        MyApp,
        HomePage,
        ProductionPage,
        ListPage,
        ListProductionsPage,
        ChecksModalPage,
        UsersModalPage,
        ReasonsModalPage,
        FinishModalPage,
        ScrapModalPage,
        NoteModalPage,
        ListProductionsModalPage,
        ConsumeModalPage,
        ConsumptionListModalPage,
        ConsumptionsPage,
        AlimentatorConsumptionsPage,
        CalculatorModalPage,
        StockInfoPage
    ],
    providers: [
        StatusBar,
        SplashScreen,
        Insomnia,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        File,
        Network,
        BarcodeScanner,
        OdooProvider,
        ProductionProvider,
        { provide: LOCALE_ID, useValue: 'es' },
    ]
})
export class AppModule { }
