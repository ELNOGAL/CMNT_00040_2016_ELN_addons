import { BrowserModule } from '@angular/platform-browser';
import { enableProdMode, ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';


import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';


import { HttpModule } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { Network } from '@ionic-native/network';
import { File } from '@ionic-native/file';

//Paginas
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { TreepickPage } from '../pages/treepick/treepick';
import { TreeopsPage } from '../pages/treeops/treeops';
import { SlideopPage } from '../pages/slideop/slideop';
import { ManualPage } from '../pages/manual/manual'
import { AuxProvider } from '../providers/aux/aux';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    TreepickPage,
    TreeopsPage,
    SlideopPage,
    ManualPage
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
    TreepickPage,
    TreeopsPage,
    SlideopPage,
    ManualPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    File,
    Network,
    AuxProvider
  ]
})
export class AppModule {}
