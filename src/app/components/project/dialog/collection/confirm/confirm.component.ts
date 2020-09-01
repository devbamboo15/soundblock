import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonTextarea } from '@ionic/angular';
import { NbDialogRef } from '@nebular/theme';
import { SubSink } from 'subsink';

import { ProjectService } from 'src/app/services/project/project';
import { CollectionService } from 'src/app/services/project/collection';
import * as _ from 'lodash';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss'],
})

export class ConfirmComponent implements OnInit, OnDestroy{
  @ViewChild('commentInput', { static: false }) commentInput: IonTextarea;

  private subs = new SubSink();
  @Input() action: any;
  @Input() category: any;
  @Input() itemType: any;
  @Input() files?: any;
  @Input() folder?: any;

  projectId: any;
  curColUuid: any;
  currentTab: any;
  comment: any;

  constructor(
    protected dialogRef: NbDialogRef<any>,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private collectionService: CollectionService,
  ) { }

  ngOnInit() {
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.currentTab = res;
    });
    this.watchRouterParams();
  }

  watchRouterParams() {
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version;
    });
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.projectId = project.project_uuid;
    });
  }

  delete() {
    if (!this.comment) {
      this.commentInput.setFocus();
      return;
    }
    if (this.itemType == 'File') {
      this.subs.sink = this.collectionService.deleteFiles(this.currentTab, this.projectId, this.comment,
        this.files).subscribe(collections => {
        this.closeWithUpdateCollections(collections);
      });
    } else if (this.itemType == 'Folder') {
      this.subs.sink = this.collectionService.deleteFolder(this.currentTab, this.projectId, this.comment,
        this.folder.directory_name, this.folder.directory_path).subscribe(collections => {
          this.closeWithUpdateCollections(collections);
      });
    }
  }
  revert() {
    if (!this.comment) {
      this.commentInput.setFocus();
      return;
    }
    if (this.itemType == 'File') {
      this.subs.sink = this.collectionService.revertFile(this.currentTab, this.curColUuid, this.comment,
        this.files).subscribe(collections => {
        this.closeWithUpdateCollections(collections);
      });
    } else if (this.itemType == 'Folder') {
      this.subs.sink = this.collectionService.revertFolder(this.currentTab, this.curColUuid, this.comment,
        this.folder.uuid).subscribe(collections => {
        this.closeWithUpdateCollections(collections);
      });
    }
  }
  restore() {
    if (!this.comment) {
      this.commentInput.setFocus();
      return;
    }
    if (this.itemType == 'File') {
      this.subs.sink = this.collectionService.restoreFile(this.currentTab, this.curColUuid, this.comment,
        this.files).subscribe(collections => {
        console.log('restore', collections);
        this.closeWithUpdateCollections(collections);
      });
    } else if (this.itemType == 'Folder') {
      this.subs.sink = this.collectionService.restoreFolder(this.currentTab, this.curColUuid, this.comment,
        this.folder.uuid).subscribe(collections => {
        this.closeWithUpdateCollections(collections);
      });
    }
  }

  getDialogTitle() {
    let title = '';
    title = `${this.action} ${this.category}`;
    if (this.action != 'Delete' || (this.files.length == 1 && this.files)) {
      title += this.itemType == 'Folder' ? ` Folder(${this.folder.directory_name})` : ` File(${this.files[0].file_name})`;
    }
    return title;
  }

  closeWithUpdateCollections(collections) {
    const newUuid = collections.data[0].collection_uuid;
    this.projectService.collections.next(collections);
    this.projectService.collectionUuid.next(newUuid);
    this.dialogRef.close({ newUuid });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
