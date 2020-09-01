import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';

import { ProjectService } from 'src/app/services/project/project';
import { CollectionService } from 'src/app/services/project/collection';
import { Project } from 'src/app/models/project';

@Component({
  selector: 'app-historybar',
  templateUrl: './historybar.html',
  styleUrls: ['./historybar.scss'],
})
export class HistorybarComponent implements OnInit, OnDestroy {

  @ViewChild('changeDetailDialog', { static: false }) changeDetailDialog: TemplateRef<any>;

  project: Project;
  projectID: number;
  collections: any;
  collectionsObs: Observable<any>;
  curColUuid: any;

  historyCollection: any;
  historyObs: Observable<any>;
  artwork = 'assets/images/bj.png';

  private subs = new SubSink();

  constructor(
    private dialogService: NbDialogService,
    public projectService: ProjectService,
    public collectionService: CollectionService,
    private activatedRoute: ActivatedRoute,
  ) { }
  ngOnInit() {
    this.getProjectInfo();
    this.watchRouterParams();
  }
  watchRouterParams() {
    this.subs.sink = this.activatedRoute.params.subscribe(params => {
      this.projectID = params.id;
      this.collectionsObs = this.projectService.getCollections(this.projectID, 1);
    });
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version;
    });
  }
  getProjectInfo() {
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.project = project;
    });
    this.subs.sink = this.projectService.watchProjectCollections().subscribe(res => {
      this.collections = res;
    });
  }

  getProjectCollections(projectUuid, page) {
    this.collectionsObs = this.projectService.getCollections(projectUuid, page);
    this.subs.sink = this.collectionsObs.subscribe(res => {
      this.projectService.collections.next(res);
      console.log('collections', res);
    });
  }

  selectVersion(collection) {
    if (this.isCurrentCollection(collection)) { return; }
    this.projectService.changeCollection(collection.collection_uuid);
  }

  showChangeDetail(e, collection) {
    e.stopPropagation();
    this.historyCollection = collection;
    this.historyObs = this.collectionService.getCollectionHistory(this.historyCollection.collection_uuid);
    this.dialogService.open(this.changeDetailDialog, {
      closeOnBackdropClick: false,
      closeOnEsc: false
    });
  }

  updateArtwork(event) {
    console.log({event});
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      this.subs.sink = this.projectService.uploadArtwork(this.projectID, file).subscribe(res => {
        console.log(res);
        this.project.artwork = res.artwork;
        this.projectService.project.next(this.project);
      });
    }
  }

  pagePrev() {
    if (this.collections.meta.current_page == 1) { return; }
    this.getProjectCollections(this.projectID, this.collections.meta.current_page - 1);
  }
  pageNext() {
    if (this.collections.meta.current_page == this.collections.meta.last_page) { return; }
    this.getProjectCollections(this.projectID, this.collections.meta.current_page + 1);
  }
  isCurrentCollection(collection) {
    if (this.curColUuid == collection.collection_uuid) {
      return true;
    }
    return false;
  }
  closeDialog(ref) {
    ref.close();
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
