import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterEvent } from '@angular/router';
import { SubSink } from 'subsink';

import { NotificationService } from 'src/app/services/support/notification';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  private subs = new SubSink();
  drafts = [];
  constructor(
    private router: Router,
    private notificationService: NotificationService,
  ) { }
  ngOnInit() { }

  onclick() {
    this.subs.sink = this.notificationService.testServer().subscribe(res => {
      console.log(res);
      alert(res);
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
