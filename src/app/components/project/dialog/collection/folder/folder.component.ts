import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonTextarea } from '@ionic/angular';
import { NbDialogRef } from '@nebular/theme';
import { SubSink } from 'subsink';
import { ProjectService } from 'src/app/services/project/project';
import { CollectionService } from 'src/app/services/project/collection';

import * as _ from 'lodash';
@Component({
  selector: 'app-folder',
  templateUrl: './folder.component.html',
  styleUrls: ['./folder.component.scss'],
})
export class FolderComponent implements OnInit, OnDestroy {
  @ViewChild('commentInput', { static: false }) commentInput: IonTextarea;
  @Input() action: any;
  @Input() category: any;
  @Input() folder?: any;
  private subs = new SubSink();

  projectId: any;
  folderName: any;
  comment: any;
  currentTab: any;

  constructor(
    protected dialogRef: NbDialogRef<any>,
    private activatedRoute: ActivatedRoute,
    private projectService: ProjectService,
    private collectionService: CollectionService,
  ) { }

  ngOnInit() {
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.projectId = project.project_uuid;
    });
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.currentTab = res;
    });
    if (this.folder) {
      this.folderName = this.folder.directory_name;
    }
  }

  submit() {
    if (!this.folderName) {
      document.getElementById('folderNameInput').focus();
      return;
    }
    if (!this.comment) {
      this.commentInput.setFocus();
      return;
    }
    const path = this.collectionService.currentPath;
    this.subs.sink = this.collectionService.addFolder(this.currentTab, this.projectId, this.comment, this.folderName,
      path).subscribe(collections => {
      const newUuid = collections.data[0].collection_uuid;
      this.projectService.collections.next(collections);
      this.projectService.collectionUuid.next(newUuid);
      this.dialogRef.close({ newUuid });
    });
  }

  edit() {
    if (!this.folderName) {
      document.getElementById('folderNameInput').focus();
      return;
    }
    if (!this.comment) {
      this.commentInput.setFocus();
      return;
    }
    const path = this.collectionService.currentPath;
    this.subs.sink = this.collectionService.editFolder(this.currentTab, this.projectId, this.comment,
      this.folder.directory_name, this.folderName, path).subscribe(collections => {
        const newUuid = collections.data[0].collection_uuid;
        this.projectService.collections.next(collections);
        this.projectService.collectionUuid.next(newUuid);
        this.dialogRef.close({ newUuid });
    });
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
