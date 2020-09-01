import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogService } from '@nebular/theme';
import { ModalController } from '@ionic/angular';
import { SubSink } from 'subsink';

import { BreadcrumbService } from 'src/app/services/project/breadcrumb';
import { CollectionService } from 'src/app/services/project/collection';
import { ProjectService } from 'src/app/services/project/project';
import { PanelService } from 'src/app/services/shared/panel';
import { UploadService } from 'src/app/services/project/upload';

import { UploadComponent } from 'src/app/components/project/dialog/collection/upload/upload.component';
import { SummaryComponent } from 'src/app/components/project/dialog/collection/summary/summary.component';
import { DetailComponent } from 'src/app/components/project/dialog/collection/detail/detail.component';
import { QueuedialogComponent } from 'src/app/components/project/dialog/collection/queuedialog/queuedialog.component';

import { Project } from 'src/app/models/project';
import { BreadcrumbItem } from 'src/app/models/breadcrumbItem';

import * as _ from 'lodash';

@Component({
  selector: 'app-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
})
export class ProjectPage implements OnInit, OnDestroy {
  private subs = new SubSink();
  projectId: any;
  projectInfo: Project;
  curColUuid: any;
  recColUuid: any;

  checkedList: any;

  currentTab: string;
  breadcrumb: BreadcrumbItem[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private modalController: ModalController,
    private router: Router,
    private breadcrumbService: BreadcrumbService,
    private collectionService: CollectionService,
    private dialogService: NbDialogService,
    private projectService: ProjectService,
    private panelService: PanelService,
    private uploadService: UploadService
  ) { }

  ngOnInit() {
    this.subs.sink = this.activatedRoute.data.subscribe((data: any) => {
      this.projectInfo = data[0];
      this.projectService.setProjectInfo(this.projectInfo);
      this.watchProjectInfo();
      this.watchRouterParams();
    });
  }

  watchProjectInfo() {
    // Watch Recent Collection Uuid
    this.subs.sink = this.projectService.watchRecentCollectionUuid().subscribe(colUuid => {
      this.recColUuid = colUuid;
    });

    // Watch Checked Files List
    this.subs.sink = this.collectionService.watchCheckedList().subscribe(res => {
      this.checkedList = res;
    });

    // Watch Current Tab
    this.subs.sink = this.collectionService.watchCurrentTab().subscribe(res => {
      this.currentTab = res;
      if (!res) { this.currentTab = 'Info'; }
    });

    // Watch Current Breadcrumb
    this.subs.sink = this.breadcrumbService.getBreadcrumb().subscribe(res => {
      this.breadcrumb = res;
    });
  }

  watchRouterParams() {
    this.subs.sink = this.activatedRoute.queryParams.subscribe(queryParams => {
      this.curColUuid = queryParams.version ? queryParams.version : this.projectService.collectionUuid.value;
      this.updateCollectionItems(queryParams.version, queryParams.path);
    });
    this.subs.sink = this.activatedRoute.params.subscribe(routeParams => {
      this.projectId = routeParams.id;
      this.getProjectCollections(this.projectId, 1);
    });
  }

  getProjectCollections(projectUuid, page) {
    this.subs.sink = this.projectService.getCollections(projectUuid, page).subscribe(res => {
      console.log('collections', res);
      const recentCol = res.data[0];
      this.projectService.collections.next(res);
      if (recentCol) {
        this.projectService.collectionUuid.next(recentCol.collection_uuid);
      }
    });
  }

  updateCollectionItems(collectionUuid, collectionPath) {
    if (!collectionUuid && !collectionPath) {
      this.breadcrumbService.initBreadcrumb();
      this.collectionService.setCurrentTab('Info');
      return;
    }
    if (!collectionUuid || !collectionPath) {
      this.router.navigate([]);
      return;
    }
    // parse tab and breadcrumb
    const pathParams = collectionPath.split('/').filter(value => value != '');
    // set tab
    if (pathParams[0] == 'Info') {
      this.router.navigate([]);
    }
    if (pathParams[0]) {
      this.collectionService.setCurrentTab(pathParams[0]);
    }
    // set breadcrumb
    this.breadcrumbService.initBreadcrumb();
    pathParams.forEach(element => {
      this.breadcrumbService.addBreadcrumbItem({ name: element });
    });
    this.collectionService.updateDataWithBreadcrumb(this.breadcrumb, collectionUuid);
  }

  setCollectionSection(tab) {
    if (!this.recColUuid) {
      // this.notificationService.showWarning('Collection', 'Please upload files');
      return;
    }
    this.collectionService.setCurrentTab(tab);
    this.currentTab = tab;
    if (tab == 'Info') {
      this.router.navigate([]);
      return;
    }
    this.breadcrumbService.initBreadcrumb(tab);
    this.router.navigate([], { queryParams: { version: this.curColUuid ? this.curColUuid : this.recColUuid, path: tab } });
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
              this.projectService.changeCollection(collections.data[0].collection_uuid);
              this.subs.sink = this.projectService.getProjectByID(this.projectId).subscribe(project => {
                this.projectInfo = project;
                this.projectService.setProjectInfo(this.projectInfo);
              })

            }
          });
          return await modal.present();
        });
      }
      this.uploadService.initFilesStatus();
    }
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

  showHistoryBar() {
    this.panelService.showHistoryBar();
  }

  navigatePage(url) {
    this.router.navigate([url]);
  }

  ionViewWillLeave() {
    this.projectInfo = new Project();
    this.curColUuid = '';
    this.currentTab = 'Info';
    this.projectService.initData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
