import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { IonTextarea } from '@ionic/angular';
import { NbDialogRef } from '@nebular/theme';
import { SubSink } from 'subsink';

import { ProjectService } from 'src/app/services/project/project';
import { CollectionService } from 'src/app/services/project/collection';
import * as _ from 'lodash';

@Component({
  selector: 'app-organize',
  templateUrl: './organize.component.html',
  styleUrls: ['./organize.component.scss'],
})
export class OrganizeComponent implements OnInit, OnDestroy {
  @ViewChild('commentInput', { static: false }) commentInput: IonTextarea;
  private subs = new SubSink();

  projectId: any;
  tracks: any;
  comment: any;
  currentTab: any;

  constructor(
    protected dialogRef: NbDialogRef<any>,
    private projectService: ProjectService,
    private collectionService: CollectionService,
  ) { }

  ngOnInit() {
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.projectId = project.project_uuid;
      this.tracks = _.cloneDeep(project.tracks);
    });
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.currentTab = res;
    });
  }

  doReorder(ev: any) {
    this.tracks = ev.detail.complete(this.tracks);
  }

  submit() {
    if (!this.comment) {
      this.commentInput.setFocus();
      return;
    }
    this.updateMusicTracks();
    this.subs.sink = this.collectionService.organizeMusic('Music', this.projectId, this.comment, this.tracks).subscribe(collections => {
      const newUuid = collections.data[0].collection_uuid;
      this.projectService.collections.next(collections);
      this.projectService.collectionUuid.next(newUuid);
      this.dialogRef.close({ newUuid });
    });
  }

  updateMusicTracks() {
    for (let i = 0; i < this.tracks.length; i ++) {
      this.tracks[i].meta.file_track = i + 1;
    }
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
