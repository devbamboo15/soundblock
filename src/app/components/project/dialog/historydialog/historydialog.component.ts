import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';

import { ProjectService } from 'src/app/services/project/project';
import { CollectionService } from 'src/app/services/project/collection';

@Component({
  selector: 'app-historydialog',
  templateUrl: './historydialog.component.html',
  styleUrls: ['./historydialog.component.scss'],
})
export class HistorydialogComponent implements OnInit {
  private subs = new SubSink();
  projectId: any;
  curColUuid: any;
  collectionsObs: Observable<any>;
  curCollection: any;
  changes: any;

  selColUuid: any;

  constructor(
    private modalController: ModalController,
    public projectService: ProjectService,
    private collectionService: CollectionService,
    private activatedRoute: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.projectId = project.project_uuid;
      this.getProjectCollections(this.projectId, 1);
    });
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version;
      this.selColUuid = this.curColUuid;
      this.subs.sink = this.collectionService.getCollectionHistory(this.curColUuid).subscribe(res => {
        this.changes = res;
      });
    });
  }

  getProjectCollections(projectUuid, page) {
    this.collectionsObs = this.projectService.getCollections(projectUuid, page);
    this.subs.sink = this.collectionsObs.subscribe(res => {
      this.curCollection = res.data.find(x => x.collection_uuid == this.curColUuid);
    });
  }

  selectVersion() {
    this.close();
    if (this.isRecentCollection(this.curCollection)) { return; }
    this.projectService.changeCollection(this.curCollection.collection_uuid);
  }

  onSelectOption(data) {
    this.curCollection = data;
    this.subs.sink = this.collectionService.getCollectionHistory(data.collection_uuid).subscribe(res => {
      this.changes = res;
    });
  }

  isRecentCollection(collection) {
    if (this.projectService.collectionUuid.value == collection.collection_uuid) {
      return true;
    }
    return false;
  }

  close() {
    this.modalController.dismiss();
  }
}
