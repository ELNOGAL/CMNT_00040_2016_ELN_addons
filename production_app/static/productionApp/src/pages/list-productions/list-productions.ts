import {Component} from '@angular/core';    

import { NavController, AlertController, NavParams} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HomePage } from '../../pages/home/home';
import { ProductionProvider } from '../../providers/production/production';
import { AlimentatorConsumptionsPage } from '../../pages/alimentator-consumptions/alimentator-consumptions';

declare var OdooApi: any;



@Component({
    selector: 'page-list-productions',
    templateUrl: 'list-productions.html'
})
export class ListProductionsPage {
    worklines = [];
    searchQuery: string = '';
    mode = '';
    items: Object[];
    workcenter_id = '';
    workline_name = '';

    constructor(public navCtrl: NavController, private storage: Storage,
        public navParams: NavParams,
        public alertCtrl: AlertController, 
        private prodData: ProductionProvider){
        this.worklines = [];
        this.workline_name = '';
        this.items = [];
        this.workcenter_id = this.navParams.get('workcenter_id')
        this.storage.get('CONEXION').then((con_data) => {
            this.mode = con_data.mode
        })
        this.getLines();
    }

    logOut(){
        let confirm = this.alertCtrl.create({
          title: '¿Salir de la aplicación?',
          message: '¿Seguro que deseas salir de la aplicación?',
          buttons: [
            {
              text: 'No',
              handler: () => {
                console.log('Disagree clicked');
              }
            },
            {
              text: 'Si',
              handler: () => {
                this.navCtrl.setRoot(HomePage, {borrar: true, login: null});
              }
            }
          ]
        });
        confirm.present();
    }

    presentAlert(titulo, texto) {
        const alert = this.alertCtrl.create({
            title: titulo,
            subTitle: texto,
            buttons: ['Ok']
        });
        alert.present();
    }

    getLines(){
        this.storage.get('CONEXION').then((con_data) => {
            var odoo = new OdooApi(con_data.url, con_data.db, con_data.uid, con_data.password);
            if (con_data == null) {
                console.log('No hay conexión');
                this.navCtrl.setRoot(HomePage, {borrar: true, login: null});
            } else {
                var domain = [
                    ['workcenter_id', '=', this.workcenter_id ],
                    ['production_state', 'in', ['ready','confirmed','in_production','finished']]];
                var fields = ['id', 'name', 'production_id', 'workcenter_id'];
                var order = 'sequence'
                odoo.search_read('mrp.production.workcenter.line', domain, fields, 0, 0, order).then((worklines) => {
                    this.worklines = worklines;
                    this.initializeItems();
                });
            }
        });
    }
    worklineSelected(workline) {
        let workline_name = workline['production_id'][1] + ' --> ' + workline['name']
        var vals = {'workcenter_id': workline.workcenter_id[0], 'workline_id': workline.id, 'workline_name': workline_name}
        this.prodData.loadProduction(vals).then( (res) => {
            this.prodData.getConsumeInOut().then( (res) => {
                this.navCtrl.push(AlimentatorConsumptionsPage);
            
            })
            .catch( (err) => {
                this.presentAlert("Error", "Falló al cargar los motivos técnicos para el centro de trabajo actual.");
            }); 

        })
        .catch( (err) => {
            this.presentAlert(err.title, err.msg);
        }); 
    }

    initializeItems() {
        this.items = this.worklines
        this.workline_name = this.worklines[0].workcenter_id[1]
    }

    getItems(ev: any) {
        // Reset items back to all of the items
        this.initializeItems();

        // set val to the value of the searchbar
        let val = ev.target.value;

        // if the value is an empty string don't filter the items
        if (val && val.trim() != '') {
            this.items = this.items.filter((item) => {
                let item_name = item['production_id'][1] + '-->' + item['name']
                return (item_name.toLowerCase().indexOf(val.toLowerCase()) > -1);
            })
        }
    }

}
