import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Router, ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { SubSink } from 'subsink';

import { CollectionService } from 'src/app/services/project/collection';
import { BreadcrumbService } from 'src/app/services/project/breadcrumb';
import { BreadcrumbItem } from 'src/app/models/breadcrumbItem';
import { ProjectService } from 'src/app/services/project/project';
import { UploadService } from 'src/app/services/project/upload';
import { SharedService } from 'src/app/services/shared/shared';

import { FilehistoryComponent } from 'src/app/components/project/dialog/filehistory/filehistory.component';
import { OrganizeComponent } from 'src/app/components/project/dialog/collection/organize/organize.component';
import { FolderComponent } from 'src/app/components/project/dialog/collection/folder/folder.component';
import { UploadComponent } from 'src/app/components/project/dialog/collection/upload/upload.component';
import { ConfirmComponent } from 'src/app/components/project/dialog/collection/confirm/confirm.component';
import { DetailComponent } from 'src/app/components/project/dialog/collection/detail/detail.component';
import { SummaryComponent } from 'src/app/components/project/dialog/collection/summary/summary.component';
import { QueuedialogComponent } from 'src/app/components/project/dialog/collection/queuedialog/queuedialog.component';
import { BlockchainComponent } from 'src/app/components/project/dialog/blockchain/blockchain.component';
import { HistorydialogComponent } from 'src/app/components/project/dialog/historydialog/historydialog.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-assettable',
  templateUrl: './assettable.component.html',
  styleUrls: ['./assettable.component.scss'],
})
export class AssettableComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  projectId: any;
  curColUuid: any;
  curItemList: any;
  currentTab: string;
  breadcrumb: BreadcrumbItem[] = [];

  columns: any;
  checkAll: boolean;
  checkArray = [];
  expandStatus = [];
  checkedList: any;

  trackCols = [];
  videoCols = [];
  merchCols = [];
  otherCols = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialogService: NbDialogService,
    private projectService: ProjectService,
    public collectionService: CollectionService,
    private uploadService: UploadService,
    public breadcrumbService: BreadcrumbService,
    public sharedService: SharedService,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.setTableCols();
    this.watchBreadcrumb();
    this.getData();
  }
  setTableCols() {
    this.trackCols = [{name: 'Track', size: 1}, {name: 'Title', size: 3}, {name: 'ISRC', size: 3},
      {name: 'Date', size: 2}, {name: 'Info', size: 0.5}, {name: 'Actions', size: 2}];
    this.videoCols = [{name: 'File', size: 3.5}, {name: 'Track', size: 2}, {name: 'ISRC', size: 2},
      {name: 'Date', size: 1.5}, {name: 'Info', size: 0.5}, {name: 'Actions', size: 2}];
    this.merchCols = [{name: 'File', size: 3.5}, {name: 'SKU', size: 2}, {name: 'Date', size: 3},
      {name: 'Info', size: 1},{name: 'Actions', size: 2}];
    this.otherCols = [{name: 'File', size: 4}, {name: 'Date', size: 3.5}, {name: 'Info', size: 1},
      {name: 'Actions', size: 3}];
  }
  watchBreadcrumb() {
    this.subs.sink = this.breadcrumbService.getBreadcrumb().subscribe(res => {
      this.breadcrumb = res;
    });
  }
  getData() {
    this.subs.sink = this.projectService.watchProjectInfo().subscribe(project => {
      this.projectId = project.project_uuid;
    });
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.currentTab = res;
      this.updateData();
    });
    this.subs.sink = this.collectionService.watchCurItemList().subscribe(res => {
      if (!res) { return; }
      this.curItemList = res;
      this.updateColumnStatus();
    });
    this.subs.sink = this.collectionService.watchCheckedList().subscribe(res => {
      this.checkedList = res;
    });
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version;
    });
  }
  updateData() {
    switch (this.currentTab) {
      case 'Music':
        this.columns = this.trackCols;
        break;
      case 'Video':
        this.columns = this.videoCols;
        break;
      case 'Merch':
        this.columns = this.merchCols;
        break;
      case 'Other':
        this.columns = this.otherCols;
        break;
    }
  }
  updateColumnStatus() {
    const files = this.curItemList.files;
    this.checkArray = new Array(files.length).fill(false);
    this.expandStatus = new Array(files.length).fill(false);
    this.checkAll = files.length > 0 ? true: false;
    for (let i = 0; i < files.length; i ++) {
      this.checkArray[i] = this.collectionService.isFileChecked(files[i]);
      if (!this.checkArray[i]) {
        this.checkAll = false;
      }
    }
  }
  onHistory(event, file) {
    event.stopPropagation();
    this.showIonModal(FilehistoryComponent, { fileUuid: file.file_uuid });
  }
  onDownload(event, file?) {
    event.stopPropagation();
    if (file) {
      this.subs.sink = this.openDialog(SummaryComponent, { file, type: 'download' }).subscribe(async res => {
        if (!res) { return; }
        this.showIonModal(QueuedialogComponent, {
          projectId: this.projectId,
          jobType: 'download'
        });
      });
    } else {
      this.subs.sink = this.openDialog(SummaryComponent, { list: this.checkedList, type: 'download' }).subscribe(res => {
        if (!res) { return; }
        this.showIonModal(QueuedialogComponent, { projectId: this.projectId, jobType: 'download' });
        this.collectionService.clearCheckedList();
        this.updateColumnStatus();
      });
    }
  }
  editFolder(event, folder) {
    event.stopPropagation();
    this.subs.sink = this.openDialog(FolderComponent, {
      action: 'Edit',
      category: this.currentTab,
      folder,
    }).subscribe(res => {
      if (!res) { return; }
      this.projectService.collections.next(res.collections);
      this.projectService.changeCollection(res.newUuid);
    });
  }
  editFiles(event, type, file?) {
    event.stopPropagation();
    const listObj = { music: [], video: [], merch: [], other: [] };
    if (file) {
      listObj[file.file_category].push(file);
    }
    const temp = type == 'single' ? listObj : this.checkedList;
    const data = _.cloneDeep(temp);
    this.subs.sink = this.openDialog(DetailComponent, { action: 'Edit', category: this.currentTab, type, data }).subscribe(res => {
      if (!res) { return; }
      this.projectService.changeCollection(res.newUuid);
    });
  }
  deleteFiles(event, type, file?) {
    event.stopPropagation();
    const temp = type == 'single' ? [file] :
      [...this.checkedList.music, ...this.checkedList.video, ...this.checkedList.merch, ...this.checkedList.other];
    const data = _.cloneDeep(temp);
    this.subs.sink = this.openDialog(ConfirmComponent, { action: 'Delete', itemType: 'File', category: this.currentTab, files: data }).subscribe(res => {
      if (!res) { return; }
      this.projectService.changeCollection(res.newUuid);
      this.collectionService.clearCheckedList();
      this.updateColumnStatus();
    });
  }
  deleteFolder(event, folder) {
    event.stopPropagation();
    this.subs.sink = this.openDialog(ConfirmComponent, { action: 'Delete', itemType: 'Folder', category: this.currentTab, folder, files: [] }).subscribe(res => {
      if (!res) {return;}
      this.projectService.changeCollection(res.newUuid);
    });
  }
  revertFile(event, file) {
    event.stopPropagation();
    this.openDialog(ConfirmComponent, { action: 'Revert', itemType: 'File', category: this.currentTab, files: [file] }).subscribe();
  }
  revertFolder(event, folder) {
    event.stopPropagation();
    this.openDialog(ConfirmComponent, { action: 'Revert', itemType: 'Folder', category: this.currentTab, folder, }).subscribe();
  }
  restoreFile(event, file) {
    event.stopPropagation();
    this.openDialog(ConfirmComponent, { action: 'Restore', itemType: 'File', category: this.currentTab, files: [file] });
  }
  restoreFolder(event, folder) {
    event.stopPropagation();
    this.openDialog(ConfirmComponent, { action: 'Restore', itemType: 'Folder', category: this.currentTab, folder });
  }
  organizeMusic() {
    this.subs.sink = this.openDialog(OrganizeComponent).subscribe(res => {
      if (!res) { return; }
      this.projectService.changeCollection(res.newUuid);
    });
  }
  addFolder() {
    this.subs.sink = this.openDialog(FolderComponent, { action: 'Add', category: this.currentTab }).subscribe(res => {
      if (!res) { return; }
      this.projectService.changeCollection(res.newUuid);
    });
  }
  uploadFile() { // step 1
    this.uploadService.initFilesStatus();
    this.subs.sink = this.openDialog(UploadComponent).subscribe(res => {
      if (!res) {
        this.uploadService.initFilesStatus();
        return;
      }
      this.uploadService.uploadCollectionFile(this.projectId, res.comment, res.uploadFile,
      this.collectionService.currentPath, this.currentTab);

      const comment = res.comment;
      this.uploadService.setSteps(this.currentTab);
      this.nextStep(comment);
    });
  }
  nextStep(comment) {
    if (this.uploadService.curStep) {
      setTimeout(() => {
        this.subs.sink = this.openDialog(DetailComponent, { action: 'Add', category: this.uploadService.curStep,
          data: this.uploadService.files, comment }).subscribe(res => {
          if (!res) {
            this.uploadService.cancelUpload();
            this.uploadService.initFilesStatus();
            return;
          }
          this.uploadService.doneCurStep();
          this.nextStep(res.comment);
        });
      }, 0);
    } else {
      if (this.uploadService.filesArr.length) {
        this.subs.sink = this.openDialog(SummaryComponent, { list: this.uploadService.files, type: 'summary', comment }).subscribe(async res => {
          if (!res) {
            this.uploadService.cancelUpload();
            this.uploadService.initFilesStatus();
            return;
          }
          if (!this.uploadService.isZip) {
            this.subs.sink = this.projectService.getCollections(this.projectId).subscribe(collections => {
              this.projectService.collections.next(collections);
              this.projectService.collectionUuid.next(collections.data[0].collection_uuid);
              this.projectService.changeCollection(collections.data[0].collection_uuid);
            });
            return;
          }
          const modal =  await this.modalController.create({
            component: QueuedialogComponent,
            componentProps: {
              projectId: this.projectId,
              jobType: 'upload'
            },
          });
          modal.onDidDismiss().then(result => {
            if (result.data) {
              const collections = result.data.collections;
              console.log({collections});
              this.projectService.collections.next(collections);
              this.projectService.collectionUuid.next(collections.data[0].collection_uuid);
              this.projectService.changeCollection(collections.data[0].collection_uuid);
            }
          });
          return await modal.present();
        });
      }
      this.uploadService.initFilesStatus();
    }
  }

  showBlockchainView(event) {
    event.stopPropagation();
    const modal = this.showIonModal(BlockchainComponent);
  }
  expandColumn(index) {
    this.expandStatus[index] = !this.expandStatus[index];
  }

  openDialog(ref: any, context?) {
    if (context) {
      return this.dialogService.open(ref, {
        closeOnBackdropClick: false,
        closeOnEsc: false,
        context
      }).onClose;
    } else {
      return this.dialogService.open(ref, {
        closeOnBackdropClick: false,
        closeOnEsc: false,
      }).onClose;
    }
  }
  async showIonModal(component, context = {}) {
    const modal = await this.modalController.create({
      component,
      componentProps: context
    });
    return await modal.present();
  }
  onClickBreadcrumb(index) {
    this.breadcrumbService.sliceBreadcrumb(index + 1);
    let param = '';
    this.breadcrumb.forEach(element => {
      param += `/${element.name}`;
    });
    this.collectionService.updateDataWithBreadcrumb(this.breadcrumb, this.curColUuid);
  }

  onCheckAll() {
    this.checkArray.fill(this.checkAll);
  }
  get isRecentCollection() {
    return this.projectService.collectionUuid.value == this.curColUuid;
  }
  getFileName(str: string) {
    const index = str.indexOf('.');
    return str.slice(0, index);
  }
  getFileKind(str: string) {
    const index = str.indexOf('.');
    return str.slice(index + 1, str.length);
  }
  clickCheckbox(file, index) {
    if (this.checkArray[index]) {
      this.collectionService.addToCheckedList(file);
    } else {
      this.collectionService.deleteFromCheckedList(file);
    }
  }
  get checkedItemsCount() {
    return this.checkedList.music.length + this.checkedList.video.length + this.checkedList.merch.length + this.checkedList.other.length;
  }
  showCheckedList() {
    console.log(this.checkedList);
    this.subs.sink = this.openDialog(SummaryComponent, { list: this.checkedList, type: 'view' }).subscribe(res => {
      this.updateColumnStatus();
    });
  }

  async showHistoryDialog() {
    const modal = await this.modalController.create({
      component: HistorydialogComponent
    });
    return await modal.present();
  }

  navigateFolder(folder) {
    this.breadcrumbService.addBreadcrumbItem({ name: folder.directory_name });
    let param = '';
    this.breadcrumb.forEach(element => {
      param += `${element.name}/`;
    });
    this.router.navigate([], { queryParams: { version: this.sharedService.getQueryParameter('version'), path: param } });
  }
  onClickInfo(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
