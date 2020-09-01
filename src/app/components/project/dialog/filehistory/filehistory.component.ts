import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { CollectionService } from 'src/app/services/project/collection';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-filehistory',
  templateUrl: './filehistory.component.html',
  styleUrls: ['./filehistory.component.scss'],
})
export class FilehistoryComponent implements OnInit, OnDestroy {
  @Input() fileUuid: any;

  private subs = new SubSink();

  historyObs: Observable<any>;

  constructor(
    private modalController: ModalController,
    private collectionService: CollectionService
  ) { }

  ngOnInit() {
    this.historyObs = this.collectionService.getFileHistory(this.fileUuid);
  }

  close() {
    this.modalController.dismiss();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
