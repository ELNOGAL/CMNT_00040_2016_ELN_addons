import { Component, ViewChildren, QueryList } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ModalController } from 'ionic-angular';
import { HomePage } from '../../pages/home/home';
import { ChecksModalPage } from '../../pages/checks-modal/checks-modal';
import { UsersModalPage } from '../../pages/users-modal/users-modal';
import { ReasonsModalPage } from '../../pages/reasons-modal/reasons-modal';
import { FinishModalPage } from '../../pages/finish-modal/finish-modal';
import { ProductionProvider } from '../../providers/production/production';
import { OdooProvider } from '../../providers/odoo/odoo';
import { TimerComponent } from '../../components/timer/timer';


@IonicPage()
@Component({
  selector: 'page-production',
  templateUrl: 'production.html',
})
export class ProductionPage {
    
    cdb;
    weight;
    hidden_class: string = 'my-hide';
    interval_list: any[] = [];

    @ViewChildren(TimerComponent) timer: QueryList<TimerComponent>;

    constructor(public navCtrl: NavController,
                public navParams: NavParams, public alertCtrl: AlertController, 
                public modalCtrl: ModalController,
                private prodData: ProductionProvider,
                private odooCon: OdooProvider) {
    }

    logOut(){
        let confirm = this.alertCtrl.create({
          title: 'Salir de la Aplicación?',
          message: 'Estás seguro que deseas salir de la aplicación?',
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

    promptNextStep(msg){
        var promise = new Promise( (resolve, reject) => {
            let confirm = this.alertCtrl.create({
              title: 'Confirmar',
              message: msg,
              buttons: [
                {
                  text: 'No',
                  handler: () => {
                    reject();
                  }
                },
                {
                  text: 'Si',
                  handler: () => {
                    if (this.prodData.active_operator_id === 0 ){
                        this.presentAlert("Error!", "No puede continuar sin un operario activo");
                        reject();
                    }
                    resolve();
                  }
                }
              ]
            });
            confirm.present();
        });
        return promise
    }

    presentAlert(titulo, texto) {
        const alert = this.alertCtrl.create({
            title: titulo,
            subTitle: texto,
            buttons: ['Ok']
        });
        alert.present();
    }

    openChecksModal(qtype, qchecks, restart_timer) {
        var promise = new Promise( (resolve, reject) => {
            var mydata = {
                'product_id': this.prodData.product_id,
                'quality_type': qtype,
                'quality_checks': qchecks
            }
            let myModal = this.modalCtrl.create(ChecksModalPage, mydata);

            // When modal closes
            myModal.onDidDismiss(data => {
                if (Object.keys(data).length !== 0) {
                    this.prodData.saveQualityChecks(data);
                    if (qtype == 'start' && restart_timer){
                        this.timer.toArray()[0].restartTimer();  // Production timer on
                    } 
                    resolve();
                }
                else{
                    reject();
                }
                
            });

            myModal.present();
        });
        return promise
    }

    openUsersModal(){
        var mydata = {}
        let usersModal = this.modalCtrl.create(UsersModalPage, mydata);
        usersModal.present();
    }

    openReasonsModal(){
        var promise = new Promise( (resolve, reject) => {
            var mydata = {}
            let reasonsModal = this.modalCtrl.create(ReasonsModalPage, mydata);
            reasonsModal.present();

            // When modal closes
            reasonsModal.onDidDismiss(reason_id => {
                if (reason_id == 0){
                    reject(reason_id)
                }
                else{
                    resolve(reason_id);
                }
            });
        });
        return promise;
    }

    openFinishModal(){
        var promise = new Promise( (resolve, reject) => {
            var mydata = {}
            let finishModal = this.modalCtrl.create(FinishModalPage, mydata);
            finishModal.present();

            // When modal closes
            finishModal.onDidDismiss(res => {
                if (Object.keys(res).length === 0) {
                    reject();
                }
                else {
                    this.prodData.qty = res.qty;
                    this.prodData.lot_name = res.lot;
                    this.prodData.lot_date = res.date;
                    this.prodData.finishProduction();
                }
            });
        });
        return promise;
    }

    clearIntervales(){
        for (let indx in this.interval_list){
            let int = this.interval_list[indx];
            clearInterval(int);
        }
        this.interval_list = [];
    }

    scheduleIntervals(delay, qchecks){
        let timerId = setInterval(() => 
        {
            this.openChecksModal('freq', qchecks, false).then(() => {}).catch(() => {});
        }, delay*60*1000);
        this.interval_list.push(timerId);
    }

    scheduleChecks(){
        var checks_by_delay = {};
        for (let i in this.prodData.freq_checks){
            let qc = this.prodData.freq_checks[i];
            if (!(qc['repeat'] in checks_by_delay)){
                checks_by_delay[qc['repeat']] = [];
            }
            checks_by_delay[qc['repeat']].push(qc) 
        }
        for (let key in checks_by_delay){
            this.scheduleIntervals(key, checks_by_delay[key]);
        }
    }


    
    // ************************************************************************
    // ************************* BUTONS FUNCTIONS *****************************
    // ************************************************************************
    beginLogistics() {
        this.presentAlert('Logistica', 'PENDIENTE DESAROLLO, LLAMAR APP ALMACÉN')
    }

    confirmProduction() {
        this.promptNextStep('Confirmar producción?').then( () => {
            this.prodData.confirmProduction();
        })
        .catch( () => {});
    }

    setupProduction() {
        this.promptNextStep('Empezar preparación?').then( () => {
            this.prodData.setupProduction();
            this.timer.toArray()[0].restartTimer()  // Set-Up timer on
        })
        .catch( () => {});
    }

    startProduction() {
        this.promptNextStep('Terminar preparación y empezar producción').then( () => {
            this.openChecksModal('start', this.prodData.start_checks, true).then( () => {
                this.prodData.startProduction();
                this.scheduleChecks();
            })
            .catch( () => {});
        })
        .catch( () => {});
    }

    stopProduction() {
        this.promptNextStep('Registrar una parada?').then( () => {
            this.hidden_class = 'my-hide'
            this.openReasonsModal().then( (reason_id) => {
                this.hidden_class = 'none'
                this.clearIntervales();
                console.log("STOP MODAL RES");
                console.log(reason_id);
                // this.timer.toArray()[0].pauseTimer();
                this.prodData.stopProduction(reason_id);
                this.timer.toArray()[1].restartTimer();
            })
            .catch( () => {
                console.log("Pues no hago nada")
            })
        })
        .catch( () => {});
    }

    restartAndCleanProduction(){
        this.promptNextStep('Reanudar producción y pasar a limpieza').then( () => {
            this.clearIntervales();
            this.timer.toArray()[0].restartTimer();
            this.hidden_class = 'my-hide'
            this.prodData.restartAndCleanProduction();
        })
        .catch( () => {});
    }

    restartProduction() {
        this.promptNextStep('Reanudar producción').then( () => {
            this.hidden_class = 'my-hide'
            this.scheduleChecks();
            this.timer.toArray()[1].pauseTimer();
            this.prodData.restartProduction();
            this.openChecksModal('start', this.prodData.start_checks, false).then(() => {}).catch(() => {});
        })
        .catch( () => {});
    }

    cleanProduction() {
        this.promptNextStep('Empezar limpieza?').then( () => {
            this.clearIntervales();
            this.timer.toArray()[0].restartTimer();
            this.prodData.cleanProduction();
        })
        .catch( () => {});
    }

    finishProduction() {
        this.promptNextStep('Finalizar producción').then( () => {
            this.timer.toArray()[0].restartTimer()
            this.timer.toArray()[0].pauseTimer()
            this.openFinishModal().then(() => {}).catch(() => {});
        })
        .catch( () => {});
    }
    loadNextProduction(){
        this.prodData.loadProduction(this.prodData.workcenter).then( (res) => {
            this.prodData.active_operator_id = 0;
        })
        .catch( (err) => {
            this.presentAlert(err.title, err.msg);
        }); 
    }

}
